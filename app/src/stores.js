import { writable, derived } from 'svelte/store';
import { timeMonth, timeDay } from 'd3-time';
import { de, en } from './locale';

export const contextMinYear = writable(1981);
export const contextRange = writable(30); // years
export const contextMaxYear = derived(
    [contextMinYear, contextRange],
    ([$contextMinYear, $contextRange]) => $contextMinYear + $contextRange
);

export const maxDate = writable(new Date(2019,11,31));

export const innerWidth = writable(window.innerWidth);
export const chartWidth = writable(1000);

export const showDays = derived(chartWidth, $cw => $cw < 500 ? 180 : 365);

export const minDate = derived([maxDate, chartWidth, showDays], ([$a, $cw, $showDays]) => {
    const approxDays = $showDays;
    // compute exact days to match days
    const lastD = timeMonth.ceil($a);
    const minD = timeMonth.floor(new Date(lastD.getTime() - approxDays * 864e5));
    const days = timeDay.count(minD, lastD);
    return new Date($a.getTime() - days * 864e5);
});

export const language = writable('de');

export const showAnomalies = writable(true);
export const labelRecordTemperatures = writable(true);

export const smoothNormalRangeWidth = writable(0);

export const msg = derived(language, lang => {
    return lang === 'de' ? de : en;
});
