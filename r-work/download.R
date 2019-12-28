needs(readr, rvest, dplyr, tidyr)
# setwd("~/projects/dwd-wetter/r-work")

url.stationen <- 'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/historical/KL_Tageswerte_Beschreibung_Stationen.txt'

stationen <- read_fwf(url.stationen,
                      skip = 3,
                      col_positions = fwf_widths(
                        c(5,9,9,15,12,10,42,21),
                        c('id','from','to','altitude','lat','lon','name','state')),
                      trim_ws = T,
                      locale = locale(encoding = 'latin1')) %>% 
  mutate(from=as.Date(as.character(from), '%Y%m%d'), to=as.Date(as.character(to), '%Y%m%d'))



download <- function(type) {
  url.index <- paste0('https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/', type, '/')
  dir.create('data', showWarnings = F)
  dir.create('dl', showWarnings = F)
  index <- read_html(url.index)
  
  urls <- index %>%
    html_nodes('a') %>% 
    html_attr('href') %>% 
    tibble(url = .) %>% 
    extract(url, c('station'),  'KL_([0-9]{5})_', remove=F) %>% 
    filter(station %in% stationen$id) %>% 
    mutate(url = paste0(url.index, url))
  
  mapply(function(station, url) {
    path.archive <- paste0('dl/', station, '-', type, '.zip')
    download.file(url, dest=path.archive)
    df <- unzip(path.archive, list=T) %>% 
      filter(grepl('produkt_', Name))
    unzip(path.archive, files=df$Name, exdir = 'dl')
    file.rename(paste0('dl/', df$Name), paste0('data/', station,'-',type,'.txt'))
  }, station=urls$station, url=urls$url)
}

# download('historical')
download('recent')

parse <- function(station) {
  print(station)
  fn.historical <- paste0('data/', station, '-historical.txt')
  fn.recent <- paste0('data/', station, '-recent.txt')  
  if (file.exists(fn.historical)) {
    data <- read_delim(fn.historical, delim = ';', trim_ws = T, col_types = cols())  
  } else if (file.exists(fn.recent)) {
    data <- read_delim(fn.recent, delim = ';', trim_ws = T, col_types = cols())  
  } else {
    return(F);
  }
  
  if (file.exists(fn.historical) && file.exists(fn.recent)) {
    data <- data %>% bind_rows(read_delim(fn.recent, delim = ';', trim_ws = T, col_types = cols()))
  }
  
  if (file.exists(fn.recent)) {
    data <- data %>% bind_rows(read_delim(fn.recent, delim = ';', trim_ws = T, col_types = cols()))
  }
  both <- data %>% 
    filter(TMK > -999) %>% 
    mutate(date=as.Date(as.character(MESS_DATUM), '%Y%m%d')) %>%
    group_by(date) %>% 
    summarise(TMK=first(TMK), TNK=first(TNK), TXK=first(TXK)) %>% 
    arrange(desc(date)) %>% 
    select(date, TMK, TNK, TXK)
  
  # fix end date in stationen list
  stationen$to[stationen$id == station] <- both$date[1]
  stationen$from[stationen$id == station] <- both$date[nrow(both)]
    
  both %>% write_csv(paste0('../app/public/data/stations/', station, '.csv'))
}

sapply(stationen$id, parse)
stationen %>% write_csv('../app/public/data/stations.csv')

unzip('dl/foo.zip')
