<script>
    import { timeFormat } from 'd3-time-format';
    import { maxDate, msg } from '../stores';

    const tfmt = timeFormat('%Y');

    $: yearStr = tfmt($maxDate);

    function changeDate(prop, offset, delay = 300) {
        let d = new Date($maxDate);
        d[`set${prop}`](d[`get${prop}`]() + offset);
        if (d >= new Date()) d = new Date();
        $maxDate = d;
    }

    const prevDay = () => changeDate('Date', -1);
    const nextDay = () => changeDate('Date', +1);
    const prevMonth = () => changeDate('Month', -1);
    const nextMonth = () => changeDate('Month', +1);
    const prevYear = () => changeDate('FullYear', -1);
    const nextYear = () => changeDate('FullYear', +1);

    function handleDateChange(event) {
        if (+event.target.value > 1881 && event.target.value < 2021) {
            $maxDate = new Date(event.target.value, 11,31);
        }
    }
    function handleMonthChange(event) {
        console.log(event.target.value, $maxDate.getFullYear());
        $maxDate = new Date($maxDate.getFullYear(), +(event.target.value)+1, 0);
        console.log($maxDate);
    }

</script>

<style>

    .btn i.im {
        font-size: 10px;
        margin: 0 -3px;
    }
    input[type=number] {
        max-width: 5em;
    }
    .form-inline {
        margin-bottom: 20px;
    }
    .btn-group input[type=number] {
        border-left: 0;
        border-right: 0;
        border-radius: 0;
    }
</style>

<div class="form-inline">

    <label>Monat</label>
    <div class="btn-group ml-2 mr-4">
        <button class="btn btn-outline-secondary" on:click="{prevMonth}">
            <i class="im im-care-left" />
        </button>
        <button class="btn btn-outline-secondary" on:click="{nextMonth}">
            <i class="im im-care-right" />
        </button>
    </div>

    <label>Jahr</label>
    <div class="btn-group ml-2 mr-4">
        <button class="btn btn-outline-secondary" on:click="{prevYear}">
            <i class="im im-care-left" />
        </button>
        <input
            class="form-control"
            type="number"
            value={$maxDate.getFullYear()}
            on:input={handleDateChange}
            on:change={handleDateChange} />
        <button class="btn btn-outline-secondary" on:click="{nextYear}">
            <i class="im im-care-right" />
        </button>
    </div>

    <button
        class="btn btn-secondary ml-2"
        on:mousedown={() => ($maxDate = new Date())}>
        {$msg.today}
    </button>

</div>