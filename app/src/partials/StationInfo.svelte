<script>
    export let station;
    import { msg } from '../stores';
</script>

<style>
    h3 {
        position: relative;
        font-size: 1.2rem;
        font-weight: bold;
        text-transform: none;
        letter-spacing: normal;
        margin-top: 2rem;
        margin-bottom: 0.5rem;
        color: #222;
        display: block;
    }
</style>

{#if station}
    <h3 lang="de">
        Höchst- und Tiefstwerte der Lufttemperatur in der Wetterstation {station.name}, {station.state}
    </h3>
    <h3 lang="en">
        Highlest and lowest air temperature measurements at weather station {station.name}, {station.state}
    </h3>
    <div class="info">

        <!-- <div class="row">
            <div class="col-sm-auto">
                <b>ID:</b>
                <tt>{station.id}</tt>
            </div>
            <div class="col-sm-auto">
                <b>{$msg.timerange}:</b>
                {$msg.monthLong[station.from.getMonth()]} {station.from.getFullYear()} {$msg.to}
                {$msg.monthLong[station.to.getMonth()]} {station.to.getFullYear()}
            </div>
            <div class="col-sm-auto">
                <b>{$msg.location}:</b>
                <a
                    target="_blank"
                    href="https://www.openstreetmap.org/#map=19/{station.lat}/{station.lon}">
                    {(+station.lat).toFixed(2)}, {(+station.lon).toFixed(2)}
                </a>
            </div>
            <div class="col-sm-auto">
                <b>{$msg.altitude}:</b>
                {station.altitude}m
            </div>
            {#if station.dist}
                <div class="col-sm-auto">
                    <b>{$msg.distance}:</b>
                    {station.dist.toFixed()}km
                </div>
            {/if}
        </div> -->
    </div>
{/if}
