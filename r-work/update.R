needs(readr, rvest, dplyr, tidyr)
# setwd("~/projects/dwd-wetter/r-work")

url.stationen <- 'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/historical/KL_Tageswerte_Beschreibung_Stationen.txt'

stationen <- read_fwf(url.stationen,
                      skip = 3,
                      col_positions = fwf_widths(
                        c(5,9,9,15,12,10,42,22),
                        c('id','from','to','altitude','lat','lon','name','state')),
                      trim_ws = T,
                      locale = locale(encoding = 'latin1')) %>% 
  mutate(from=as.Date(as.character(from), '%Y%m%d'), to=as.Date(as.character(to), '%Y%m%d'))

source('download.R')

# download('historical')
download('recent')

source('parse.R')

sapply(stationen$id, parse)

stationen %>% write_csv('../app/public/data/stations.csv')

