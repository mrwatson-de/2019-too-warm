
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.setAttribute('aria-hidden', 'true');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var EOL = {},
        EOF = {},
        QUOTE = 34,
        NEWLINE = 10,
        RETURN = 13;

    function objectConverter(columns) {
      return new Function("d", "return {" + columns.map(function(name, i) {
        return JSON.stringify(name) + ": d[" + i + "] || \"\"";
      }).join(",") + "}");
    }

    function customConverter(columns, f) {
      var object = objectConverter(columns);
      return function(row, i) {
        return f(object(row), i, columns);
      };
    }

    // Compute unique columns in order of discovery.
    function inferColumns(rows) {
      var columnSet = Object.create(null),
          columns = [];

      rows.forEach(function(row) {
        for (var column in row) {
          if (!(column in columnSet)) {
            columns.push(columnSet[column] = column);
          }
        }
      });

      return columns;
    }

    function pad(value, width) {
      var s = value + "", length = s.length;
      return length < width ? new Array(width - length + 1).join(0) + s : s;
    }

    function formatYear(year) {
      return year < 0 ? "-" + pad(-year, 6)
        : year > 9999 ? "+" + pad(year, 6)
        : pad(year, 4);
    }

    function formatDate(date) {
      var hours = date.getUTCHours(),
          minutes = date.getUTCMinutes(),
          seconds = date.getUTCSeconds(),
          milliseconds = date.getUTCMilliseconds();
      return isNaN(date) ? "Invalid Date"
          : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
          + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
          : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
          : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
          : "");
    }

    function dsvFormat(delimiter) {
      var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
          DELIMITER = delimiter.charCodeAt(0);

      function parse(text, f) {
        var convert, columns, rows = parseRows(text, function(row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
        rows.columns = columns || [];
        return rows;
      }

      function parseRows(text, f) {
        var rows = [], // output rows
            N = text.length,
            I = 0, // current character index
            n = 0, // current line number
            t, // current token
            eof = N <= 0, // current token followed by EOF?
            eol = false; // current token followed by EOL?

        // Strip the trailing newline.
        if (text.charCodeAt(N - 1) === NEWLINE) --N;
        if (text.charCodeAt(N - 1) === RETURN) --N;

        function token() {
          if (eof) return EOF;
          if (eol) return eol = false, EOL;

          // Unescape quotes.
          var i, j = I, c;
          if (text.charCodeAt(j) === QUOTE) {
            while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
            if ((i = I) >= N) eof = true;
            else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            return text.slice(j + 1, i - 1).replace(/""/g, "\"");
          }

          // Find next delimiter or newline.
          while (I < N) {
            if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            else if (c !== DELIMITER) continue;
            return text.slice(j, i);
          }

          // Return last token before EOF.
          return eof = true, text.slice(j, N);
        }

        while ((t = token()) !== EOF) {
          var row = [];
          while (t !== EOL && t !== EOF) row.push(t), t = token();
          if (f && (row = f(row, n++)) == null) continue;
          rows.push(row);
        }

        return rows;
      }

      function preformatBody(rows, columns) {
        return rows.map(function(row) {
          return columns.map(function(column) {
            return formatValue(row[column]);
          }).join(delimiter);
        });
      }

      function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
      }

      function formatBody(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return preformatBody(rows, columns).join("\n");
      }

      function formatRows(rows) {
        return rows.map(formatRow).join("\n");
      }

      function formatRow(row) {
        return row.map(formatValue).join(delimiter);
      }

      function formatValue(value) {
        return value == null ? ""
            : value instanceof Date ? formatDate(value)
            : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
            : value;
      }

      return {
        parse: parse,
        parseRows: parseRows,
        format: format,
        formatBody: formatBody,
        formatRows: formatRows,
        formatRow: formatRow,
        formatValue: formatValue
      };
    }

    var csv = dsvFormat(",");

    var csvParse = csv.parse;

    function responseText(response) {
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      return response.text();
    }

    function text$1(input, init) {
      return fetch(input, init).then(responseText);
    }

    function dsvParse(parse) {
      return function(input, init, row) {
        if (arguments.length === 2 && typeof init === "function") row = init, init = undefined;
        return text$1(input, init).then(function(response) {
          return parse(response, row);
        });
      };
    }

    var csv$1 = dsvParse(csvParse);

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(compare) {
      if (compare.length === 1) compare = ascendingComparator(compare);
      return {
        left: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          }
          return lo;
        },
        right: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) > 0) hi = mid;
            else lo = mid + 1;
          }
          return lo;
        }
      };
    }

    function ascendingComparator(f) {
      return function(d, x) {
        return ascending(f(d), x);
      };
    }

    var ascendingBisect = bisector(ascending);
    var bisectRight = ascendingBisect.right;

    function identity(x) {
      return x;
    }

    function group(values, ...keys) {
      return nest(values, identity, identity, keys);
    }

    function nest(values, map, reduce, keys) {
      return (function regroup(values, i) {
        if (i >= keys.length) return reduce(values);
        const groups = new Map();
        const keyof = keys[i++];
        let index = -1;
        for (const value of values) {
          const key = keyof(value, ++index, values);
          const group = groups.get(key);
          if (group) group.push(value);
          else groups.set(key, [value]);
        }
        for (const [key, values] of groups) {
          groups.set(key, regroup(values, i));
        }
        return map(groups);
      })(values, 0);
    }

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
          i = -1,
          n,
          ticks,
          step;

      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

      if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) ticks[i] = (start + i) * step;
      } else {
        start = Math.floor(start * step);
        stop = Math.ceil(stop * step);
        ticks = new Array(n = Math.ceil(start - stop + 1));
        while (++i < n) ticks[i] = (start - i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log(step) / Math.LN10),
          error = step / Math.pow(10, power);
      return power >= 0
          ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
          : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
          step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
          error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    }

    function max(values, valueof) {
      let max;
      if (valueof === undefined) {
        for (const value of values) {
          if (value != null
              && (max < value || (max === undefined && value >= value))) {
            max = value;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null
              && (max < value || (max === undefined && value >= value))) {
            max = value;
          }
        }
      }
      return max;
    }

    function min(values, valueof) {
      let min;
      if (valueof === undefined) {
        for (const value of values) {
          if (value != null
              && (min > value || (min === undefined && value >= value))) {
            min = value;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null
              && (min > value || (min === undefined && value >= value))) {
            min = value;
          }
        }
      }
      return min;
    }

    function number(x) {
      return x === null ? NaN : +x;
    }

    function quantileSorted(values, p, valueof = number) {
      if (!(n = values.length)) return;
      if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values);
      if (p >= 1) return +valueof(values[n - 1], n - 1, values);
      var n,
          i = (n - 1) * p,
          i0 = Math.floor(i),
          value0 = +valueof(values[i0], i0, values),
          value1 = +valueof(values[i0 + 1], i0 + 1, values);
      return value0 + (value1 - value0) * (i - i0);
    }

    function mean(values, valueof) {
      let count = 0;
      let sum = 0;
      if (valueof === undefined) {
        for (let value of values) {
          if (value != null && (value = +value) >= value) {
            ++count, sum += value;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
            ++count, sum += value;
          }
        }
      }
      if (count) return sum / count;
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var t0 = new Date,
        t1 = new Date;

    function newInterval(floori, offseti, count, field) {

      function interval(date) {
        return floori(date = arguments.length === 0 ? new Date : new Date(+date)), date;
      }

      interval.floor = function(date) {
        return floori(date = new Date(+date)), date;
      };

      interval.ceil = function(date) {
        return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
      };

      interval.round = function(date) {
        var d0 = interval(date),
            d1 = interval.ceil(date);
        return date - d0 < d1 - date ? d0 : d1;
      };

      interval.offset = function(date, step) {
        return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
      };

      interval.range = function(start, stop, step) {
        var range = [], previous;
        start = interval.ceil(start);
        step = step == null ? 1 : Math.floor(step);
        if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
        do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
        while (previous < start && start < stop);
        return range;
      };

      interval.filter = function(test) {
        return newInterval(function(date) {
          if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
        }, function(date, step) {
          if (date >= date) {
            if (step < 0) while (++step <= 0) {
              while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
            } else while (--step >= 0) {
              while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
            }
          }
        });
      };

      if (count) {
        interval.count = function(start, end) {
          t0.setTime(+start), t1.setTime(+end);
          floori(t0), floori(t1);
          return Math.floor(count(t0, t1));
        };

        interval.every = function(step) {
          step = Math.floor(step);
          return !isFinite(step) || !(step > 0) ? null
              : !(step > 1) ? interval
              : interval.filter(field
                  ? function(d) { return field(d) % step === 0; }
                  : function(d) { return interval.count(0, d) % step === 0; });
        };
      }

      return interval;
    }

    var millisecond = newInterval(function() {
      // noop
    }, function(date, step) {
      date.setTime(+date + step);
    }, function(start, end) {
      return end - start;
    });

    // An optimized implementation for this simple case.
    millisecond.every = function(k) {
      k = Math.floor(k);
      if (!isFinite(k) || !(k > 0)) return null;
      if (!(k > 1)) return millisecond;
      return newInterval(function(date) {
        date.setTime(Math.floor(date / k) * k);
      }, function(date, step) {
        date.setTime(+date + step * k);
      }, function(start, end) {
        return (end - start) / k;
      });
    };

    var durationSecond = 1e3;
    var durationMinute = 6e4;
    var durationHour = 36e5;
    var durationDay = 864e5;
    var durationWeek = 6048e5;

    var second = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds());
    }, function(date, step) {
      date.setTime(+date + step * durationSecond);
    }, function(start, end) {
      return (end - start) / durationSecond;
    }, function(date) {
      return date.getUTCSeconds();
    });

    var minute = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
    }, function(date, step) {
      date.setTime(+date + step * durationMinute);
    }, function(start, end) {
      return (end - start) / durationMinute;
    }, function(date) {
      return date.getMinutes();
    });

    var hour = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
    }, function(date, step) {
      date.setTime(+date + step * durationHour);
    }, function(start, end) {
      return (end - start) / durationHour;
    }, function(date) {
      return date.getHours();
    });

    var day = newInterval(function(date) {
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setDate(date.getDate() + step);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
    }, function(date) {
      return date.getDate() - 1;
    });
    var days = day.range;

    function weekday(i) {
      return newInterval(function(date) {
        date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setDate(date.getDate() + step * 7);
      }, function(start, end) {
        return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
      });
    }

    var sunday = weekday(0);
    var monday = weekday(1);
    var tuesday = weekday(2);
    var wednesday = weekday(3);
    var thursday = weekday(4);
    var friday = weekday(5);
    var saturday = weekday(6);

    var month = newInterval(function(date) {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setMonth(date.getMonth() + step);
    }, function(start, end) {
      return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
    }, function(date) {
      return date.getMonth();
    });

    var year = newInterval(function(date) {
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step);
    }, function(start, end) {
      return end.getFullYear() - start.getFullYear();
    }, function(date) {
      return date.getFullYear();
    });

    // An optimized implementation for this simple case.
    year.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setFullYear(Math.floor(date.getFullYear() / k) * k);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setFullYear(date.getFullYear() + step * k);
      });
    };

    var utcDay = newInterval(function(date) {
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step);
    }, function(start, end) {
      return (end - start) / durationDay;
    }, function(date) {
      return date.getUTCDate() - 1;
    });

    function utcWeekday(i) {
      return newInterval(function(date) {
        date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCDate(date.getUTCDate() + step * 7);
      }, function(start, end) {
        return (end - start) / durationWeek;
      });
    }

    var utcSunday = utcWeekday(0);
    var utcMonday = utcWeekday(1);
    var utcTuesday = utcWeekday(2);
    var utcWednesday = utcWeekday(3);
    var utcThursday = utcWeekday(4);
    var utcFriday = utcWeekday(5);
    var utcSaturday = utcWeekday(6);

    var utcYear = newInterval(function(date) {
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step);
    }, function(start, end) {
      return end.getUTCFullYear() - start.getUTCFullYear();
    }, function(date) {
      return date.getUTCFullYear();
    });

    // An optimized implementation for this simple case.
    utcYear.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
        date.setUTCMonth(0, 1);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCFullYear(date.getUTCFullYear() + step * k);
      });
    };

    const contextMinYear = writable(1981);
    const contextRange = writable(30); // years
    const contextMaxYear = derived(
        [contextMinYear, contextRange],
        ([$contextMinYear, $contextRange]) => $contextMinYear + $contextRange
    );

    const normalRange = writable(50);

    const maxDate = writable(new Date());

    const innerWidth = writable(window.innerWidth);
    const chartWidth = writable(1000);

    const showDays = derived(chartWidth, $cw => Math.round($cw / 4));

    const minDate = derived([maxDate, chartWidth], ([$a, $cw]) => {
        const approxDays = Math.round(($cw - 50) / 4);
        // compute exact days to match days
        const lastD = month.ceil($a);
        const minD = month.floor(new Date(lastD.getTime() - approxDays * 864e5));
        const days = day.count(minD, lastD);
        return new Date($a.getTime() - days * 864e5);
    });

    const language = writable('de');

    const showAnomalies = writable(true);

    const msg = derived(language, lang => {
        if (lang === 'de')
            return {
                today: 'Heute',
                year: 'Jahr',
                month: 'Monat',
                day: 'Tag',
                timerange: 'Zeitraum',
                to: 'bis',
                selectStation: 'Wetterstation auswählen',
                altitude: 'Stationshöhe',
                tooltipDateFormat: '%d. %b',
                monthLong: 'Januar,Februar,März,April,Mai,Juni,Juli,August,September,Oktober,November,Dezember'.split(
                    ','
                ),
                monthShort: 'Jan.,Feb.,März,April,Mai,Juni,Juli,Aug.,Sept.,Okt.,Nov.,Dez.'.split(',')
            };
        return {
            today: 'Today',
            year: 'Year',
            month: 'Month',
            day: 'Day',
            timerange: 'Range',
            to: 'to',
            selectStation: 'Select weather station',
            altitude: 'Station altitude',
            tooltipDateFormat: '%b %d',
            monthLong: 'January,February,March,April,May,June,July,August,September,October,November,December'.split(
                ','
            ),
            monthShort: 'Jan.,Feb.,March,April,May,June,July,Aug.,Sept.,Oct.,Nov.,Dec.'.split(',')
        };
    });

    const smoothNormalRangeWidth = writable(0);

    function localDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
        date.setFullYear(d.y);
        return date;
      }
      return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
    }

    function utcDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
        date.setUTCFullYear(d.y);
        return date;
      }
      return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
    }

    function newDate(y, m, d) {
      return {y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0};
    }

    function formatLocale(locale) {
      var locale_dateTime = locale.dateTime,
          locale_date = locale.date,
          locale_time = locale.time,
          locale_periods = locale.periods,
          locale_weekdays = locale.days,
          locale_shortWeekdays = locale.shortDays,
          locale_months = locale.months,
          locale_shortMonths = locale.shortMonths;

      var periodRe = formatRe(locale_periods),
          periodLookup = formatLookup(locale_periods),
          weekdayRe = formatRe(locale_weekdays),
          weekdayLookup = formatLookup(locale_weekdays),
          shortWeekdayRe = formatRe(locale_shortWeekdays),
          shortWeekdayLookup = formatLookup(locale_shortWeekdays),
          monthRe = formatRe(locale_months),
          monthLookup = formatLookup(locale_months),
          shortMonthRe = formatRe(locale_shortMonths),
          shortMonthLookup = formatLookup(locale_shortMonths);

      var formats = {
        "a": formatShortWeekday,
        "A": formatWeekday,
        "b": formatShortMonth,
        "B": formatMonth,
        "c": null,
        "d": formatDayOfMonth,
        "e": formatDayOfMonth,
        "f": formatMicroseconds,
        "H": formatHour24,
        "I": formatHour12,
        "j": formatDayOfYear,
        "L": formatMilliseconds,
        "m": formatMonthNumber,
        "M": formatMinutes,
        "p": formatPeriod,
        "q": formatQuarter,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatSeconds,
        "u": formatWeekdayNumberMonday,
        "U": formatWeekNumberSunday,
        "V": formatWeekNumberISO,
        "w": formatWeekdayNumberSunday,
        "W": formatWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatYear$1,
        "Y": formatFullYear,
        "Z": formatZone,
        "%": formatLiteralPercent
      };

      var utcFormats = {
        "a": formatUTCShortWeekday,
        "A": formatUTCWeekday,
        "b": formatUTCShortMonth,
        "B": formatUTCMonth,
        "c": null,
        "d": formatUTCDayOfMonth,
        "e": formatUTCDayOfMonth,
        "f": formatUTCMicroseconds,
        "H": formatUTCHour24,
        "I": formatUTCHour12,
        "j": formatUTCDayOfYear,
        "L": formatUTCMilliseconds,
        "m": formatUTCMonthNumber,
        "M": formatUTCMinutes,
        "p": formatUTCPeriod,
        "q": formatUTCQuarter,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatUTCSeconds,
        "u": formatUTCWeekdayNumberMonday,
        "U": formatUTCWeekNumberSunday,
        "V": formatUTCWeekNumberISO,
        "w": formatUTCWeekdayNumberSunday,
        "W": formatUTCWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatUTCYear,
        "Y": formatUTCFullYear,
        "Z": formatUTCZone,
        "%": formatLiteralPercent
      };

      var parses = {
        "a": parseShortWeekday,
        "A": parseWeekday,
        "b": parseShortMonth,
        "B": parseMonth,
        "c": parseLocaleDateTime,
        "d": parseDayOfMonth,
        "e": parseDayOfMonth,
        "f": parseMicroseconds,
        "H": parseHour24,
        "I": parseHour24,
        "j": parseDayOfYear,
        "L": parseMilliseconds,
        "m": parseMonthNumber,
        "M": parseMinutes,
        "p": parsePeriod,
        "q": parseQuarter,
        "Q": parseUnixTimestamp,
        "s": parseUnixTimestampSeconds,
        "S": parseSeconds,
        "u": parseWeekdayNumberMonday,
        "U": parseWeekNumberSunday,
        "V": parseWeekNumberISO,
        "w": parseWeekdayNumberSunday,
        "W": parseWeekNumberMonday,
        "x": parseLocaleDate,
        "X": parseLocaleTime,
        "y": parseYear,
        "Y": parseFullYear,
        "Z": parseZone,
        "%": parseLiteralPercent
      };

      // These recursive directive definitions must be deferred.
      formats.x = newFormat(locale_date, formats);
      formats.X = newFormat(locale_time, formats);
      formats.c = newFormat(locale_dateTime, formats);
      utcFormats.x = newFormat(locale_date, utcFormats);
      utcFormats.X = newFormat(locale_time, utcFormats);
      utcFormats.c = newFormat(locale_dateTime, utcFormats);

      function newFormat(specifier, formats) {
        return function(date) {
          var string = [],
              i = -1,
              j = 0,
              n = specifier.length,
              c,
              pad,
              format;

          if (!(date instanceof Date)) date = new Date(+date);

          while (++i < n) {
            if (specifier.charCodeAt(i) === 37) {
              string.push(specifier.slice(j, i));
              if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
              else pad = c === "e" ? " " : "0";
              if (format = formats[c]) c = format(date, pad);
              string.push(c);
              j = i + 1;
            }
          }

          string.push(specifier.slice(j, i));
          return string.join("");
        };
      }

      function newParse(specifier, Z) {
        return function(string) {
          var d = newDate(1900, undefined, 1),
              i = parseSpecifier(d, specifier, string += "", 0),
              week, day$1;
          if (i != string.length) return null;

          // If a UNIX timestamp is specified, return it.
          if ("Q" in d) return new Date(d.Q);
          if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0));

          // If this is utcParse, never use the local timezone.
          if (Z && !("Z" in d)) d.Z = 0;

          // The am-pm flag is 0 for AM, and 1 for PM.
          if ("p" in d) d.H = d.H % 12 + d.p * 12;

          // If the month was not specified, inherit from the quarter.
          if (d.m === undefined) d.m = "q" in d ? d.q : 0;

          // Convert day-of-week and week-of-year to day-of-year.
          if ("V" in d) {
            if (d.V < 1 || d.V > 53) return null;
            if (!("w" in d)) d.w = 1;
            if ("Z" in d) {
              week = utcDate(newDate(d.y, 0, 1)), day$1 = week.getUTCDay();
              week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
              week = utcDay.offset(week, (d.V - 1) * 7);
              d.y = week.getUTCFullYear();
              d.m = week.getUTCMonth();
              d.d = week.getUTCDate() + (d.w + 6) % 7;
            } else {
              week = localDate(newDate(d.y, 0, 1)), day$1 = week.getDay();
              week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
              week = day.offset(week, (d.V - 1) * 7);
              d.y = week.getFullYear();
              d.m = week.getMonth();
              d.d = week.getDate() + (d.w + 6) % 7;
            }
          } else if ("W" in d || "U" in d) {
            if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
            day$1 = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
            d.m = 0;
            d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
          }

          // If a time zone is specified, all fields are interpreted as UTC and then
          // offset according to the specified time zone.
          if ("Z" in d) {
            d.H += d.Z / 100 | 0;
            d.M += d.Z % 100;
            return utcDate(d);
          }

          // Otherwise, all fields are in local time.
          return localDate(d);
        };
      }

      function parseSpecifier(d, specifier, string, j) {
        var i = 0,
            n = specifier.length,
            m = string.length,
            c,
            parse;

        while (i < n) {
          if (j >= m) return -1;
          c = specifier.charCodeAt(i++);
          if (c === 37) {
            c = specifier.charAt(i++);
            parse = parses[c in pads ? specifier.charAt(i++) : c];
            if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
          } else if (c != string.charCodeAt(j++)) {
            return -1;
          }
        }

        return j;
      }

      function parsePeriod(d, string, i) {
        var n = periodRe.exec(string.slice(i));
        return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseShortWeekday(d, string, i) {
        var n = shortWeekdayRe.exec(string.slice(i));
        return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseWeekday(d, string, i) {
        var n = weekdayRe.exec(string.slice(i));
        return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseShortMonth(d, string, i) {
        var n = shortMonthRe.exec(string.slice(i));
        return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseMonth(d, string, i) {
        var n = monthRe.exec(string.slice(i));
        return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseLocaleDateTime(d, string, i) {
        return parseSpecifier(d, locale_dateTime, string, i);
      }

      function parseLocaleDate(d, string, i) {
        return parseSpecifier(d, locale_date, string, i);
      }

      function parseLocaleTime(d, string, i) {
        return parseSpecifier(d, locale_time, string, i);
      }

      function formatShortWeekday(d) {
        return locale_shortWeekdays[d.getDay()];
      }

      function formatWeekday(d) {
        return locale_weekdays[d.getDay()];
      }

      function formatShortMonth(d) {
        return locale_shortMonths[d.getMonth()];
      }

      function formatMonth(d) {
        return locale_months[d.getMonth()];
      }

      function formatPeriod(d) {
        return locale_periods[+(d.getHours() >= 12)];
      }

      function formatQuarter(d) {
        return 1 + ~~(d.getMonth() / 3);
      }

      function formatUTCShortWeekday(d) {
        return locale_shortWeekdays[d.getUTCDay()];
      }

      function formatUTCWeekday(d) {
        return locale_weekdays[d.getUTCDay()];
      }

      function formatUTCShortMonth(d) {
        return locale_shortMonths[d.getUTCMonth()];
      }

      function formatUTCMonth(d) {
        return locale_months[d.getUTCMonth()];
      }

      function formatUTCPeriod(d) {
        return locale_periods[+(d.getUTCHours() >= 12)];
      }

      function formatUTCQuarter(d) {
        return 1 + ~~(d.getUTCMonth() / 3);
      }

      return {
        format: function(specifier) {
          var f = newFormat(specifier += "", formats);
          f.toString = function() { return specifier; };
          return f;
        },
        parse: function(specifier) {
          var p = newParse(specifier += "", false);
          p.toString = function() { return specifier; };
          return p;
        },
        utcFormat: function(specifier) {
          var f = newFormat(specifier += "", utcFormats);
          f.toString = function() { return specifier; };
          return f;
        },
        utcParse: function(specifier) {
          var p = newParse(specifier += "", true);
          p.toString = function() { return specifier; };
          return p;
        }
      };
    }

    var pads = {"-": "", "_": " ", "0": "0"},
        numberRe = /^\s*\d+/, // note: ignores next directive
        percentRe = /^%/,
        requoteRe = /[\\^$*+?|[\]().{}]/g;

    function pad$1(value, fill, width) {
      var sign = value < 0 ? "-" : "",
          string = (sign ? -value : value) + "",
          length = string.length;
      return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
    }

    function requote(s) {
      return s.replace(requoteRe, "\\$&");
    }

    function formatRe(names) {
      return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
    }

    function formatLookup(names) {
      var map = {}, i = -1, n = names.length;
      while (++i < n) map[names[i].toLowerCase()] = i;
      return map;
    }

    function parseWeekdayNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.w = +n[0], i + n[0].length) : -1;
    }

    function parseWeekdayNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.u = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.U = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberISO(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.V = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.W = +n[0], i + n[0].length) : -1;
    }

    function parseFullYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 4));
      return n ? (d.y = +n[0], i + n[0].length) : -1;
    }

    function parseYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
    }

    function parseZone(d, string, i) {
      var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
      return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
    }

    function parseQuarter(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
    }

    function parseMonthNumber(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
    }

    function parseDayOfMonth(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.d = +n[0], i + n[0].length) : -1;
    }

    function parseDayOfYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
    }

    function parseHour24(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.H = +n[0], i + n[0].length) : -1;
    }

    function parseMinutes(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.M = +n[0], i + n[0].length) : -1;
    }

    function parseSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.S = +n[0], i + n[0].length) : -1;
    }

    function parseMilliseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.L = +n[0], i + n[0].length) : -1;
    }

    function parseMicroseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 6));
      return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
    }

    function parseLiteralPercent(d, string, i) {
      var n = percentRe.exec(string.slice(i, i + 1));
      return n ? i + n[0].length : -1;
    }

    function parseUnixTimestamp(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.Q = +n[0], i + n[0].length) : -1;
    }

    function parseUnixTimestampSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.s = +n[0], i + n[0].length) : -1;
    }

    function formatDayOfMonth(d, p) {
      return pad$1(d.getDate(), p, 2);
    }

    function formatHour24(d, p) {
      return pad$1(d.getHours(), p, 2);
    }

    function formatHour12(d, p) {
      return pad$1(d.getHours() % 12 || 12, p, 2);
    }

    function formatDayOfYear(d, p) {
      return pad$1(1 + day.count(year(d), d), p, 3);
    }

    function formatMilliseconds(d, p) {
      return pad$1(d.getMilliseconds(), p, 3);
    }

    function formatMicroseconds(d, p) {
      return formatMilliseconds(d, p) + "000";
    }

    function formatMonthNumber(d, p) {
      return pad$1(d.getMonth() + 1, p, 2);
    }

    function formatMinutes(d, p) {
      return pad$1(d.getMinutes(), p, 2);
    }

    function formatSeconds(d, p) {
      return pad$1(d.getSeconds(), p, 2);
    }

    function formatWeekdayNumberMonday(d) {
      var day = d.getDay();
      return day === 0 ? 7 : day;
    }

    function formatWeekNumberSunday(d, p) {
      return pad$1(sunday.count(year(d) - 1, d), p, 2);
    }

    function formatWeekNumberISO(d, p) {
      var day = d.getDay();
      d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
      return pad$1(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
    }

    function formatWeekdayNumberSunday(d) {
      return d.getDay();
    }

    function formatWeekNumberMonday(d, p) {
      return pad$1(monday.count(year(d) - 1, d), p, 2);
    }

    function formatYear$1(d, p) {
      return pad$1(d.getFullYear() % 100, p, 2);
    }

    function formatFullYear(d, p) {
      return pad$1(d.getFullYear() % 10000, p, 4);
    }

    function formatZone(d) {
      var z = d.getTimezoneOffset();
      return (z > 0 ? "-" : (z *= -1, "+"))
          + pad$1(z / 60 | 0, "0", 2)
          + pad$1(z % 60, "0", 2);
    }

    function formatUTCDayOfMonth(d, p) {
      return pad$1(d.getUTCDate(), p, 2);
    }

    function formatUTCHour24(d, p) {
      return pad$1(d.getUTCHours(), p, 2);
    }

    function formatUTCHour12(d, p) {
      return pad$1(d.getUTCHours() % 12 || 12, p, 2);
    }

    function formatUTCDayOfYear(d, p) {
      return pad$1(1 + utcDay.count(utcYear(d), d), p, 3);
    }

    function formatUTCMilliseconds(d, p) {
      return pad$1(d.getUTCMilliseconds(), p, 3);
    }

    function formatUTCMicroseconds(d, p) {
      return formatUTCMilliseconds(d, p) + "000";
    }

    function formatUTCMonthNumber(d, p) {
      return pad$1(d.getUTCMonth() + 1, p, 2);
    }

    function formatUTCMinutes(d, p) {
      return pad$1(d.getUTCMinutes(), p, 2);
    }

    function formatUTCSeconds(d, p) {
      return pad$1(d.getUTCSeconds(), p, 2);
    }

    function formatUTCWeekdayNumberMonday(d) {
      var dow = d.getUTCDay();
      return dow === 0 ? 7 : dow;
    }

    function formatUTCWeekNumberSunday(d, p) {
      return pad$1(utcSunday.count(utcYear(d) - 1, d), p, 2);
    }

    function formatUTCWeekNumberISO(d, p) {
      var day = d.getUTCDay();
      d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
      return pad$1(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
    }

    function formatUTCWeekdayNumberSunday(d) {
      return d.getUTCDay();
    }

    function formatUTCWeekNumberMonday(d, p) {
      return pad$1(utcMonday.count(utcYear(d) - 1, d), p, 2);
    }

    function formatUTCYear(d, p) {
      return pad$1(d.getUTCFullYear() % 100, p, 2);
    }

    function formatUTCFullYear(d, p) {
      return pad$1(d.getUTCFullYear() % 10000, p, 4);
    }

    function formatUTCZone() {
      return "+0000";
    }

    function formatLiteralPercent() {
      return "%";
    }

    function formatUnixTimestamp(d) {
      return +d;
    }

    function formatUnixTimestampSeconds(d) {
      return Math.floor(+d / 1000);
    }

    var locale;
    var timeFormat;
    var timeParse;
    var utcFormat;
    var utcParse;

    defaultLocale({
      dateTime: "%x, %X",
      date: "%-m/%-d/%Y",
      time: "%-I:%M:%S %p",
      periods: ["AM", "PM"],
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      timeFormat = locale.format;
      timeParse = locale.parse;
      utcFormat = locale.utcFormat;
      utcParse = locale.utcParse;
      return locale;
    }

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
        reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
        reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
        reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
        reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
        reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy: function(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable: function() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? new Rgb(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? new Rgb((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb: function() {
        return this;
      },
      displayable: function() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return "#" + hex(this.r) + hex(this.g) + hex(this.b);
    }

    function rgb_formatRgb() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      displayable: function() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl: function() {
        var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
        return (a === 1 ? "hsl(" : "hsla(")
            + (this.h || 0) + ", "
            + (this.s || 0) * 100 + "%, "
            + (this.l || 0) * 100 + "%"
            + (a === 1 ? ")" : ", " + a + ")");
      }
    }));

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    function constant(x) {
      return function() {
        return x;
      };
    }

    function linear(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear(a, d) : constant(isNaN(a) ? b : a);
    }

    var rgb$1 = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
          c = b.slice(),
          i;
      return function(t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b = +b, function(t) {
        return d.setTime(a * (1 - t) + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolate(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function string(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolate(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, rgb$1) : string)
          : b instanceof color ? rgb$1
          : b instanceof Date ? date
          : isNumberArray(b) ? numberArray
          : Array.isArray(b) ? genericArray
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b = +b, function(t) {
        return Math.round(a * (1 - t) + b * t);
      };
    }

    function constant$1(x) {
      return function() {
        return x;
      };
    }

    function number$1(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity$1(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constant$1(isNaN(b) ? NaN : 0.5);
    }

    function clamper(a, b) {
      var t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisectRight(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
          range = unit,
          interpolate$1 = interpolate,
          transform,
          untransform,
          unknown,
          clamp = identity$1,
          piecewise,
          output,
          input;

      function rescale() {
        var n = Math.min(domain.length, range.length);
        if (clamp !== identity$1) clamp = clamper(domain[0], domain[n - 1]);
        piecewise = n > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate$1)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = Array.from(_, number$1), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = Array.from(_), interpolate$1 = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? true : identity$1, rescale()) : clamp !== identity$1;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate$1 = _, rescale()) : interpolate$1;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous() {
      return transformer()(identity$1, identity$1);
    }

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimal(1.23) returns ["123", 0].
    function formatDecimal(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10]
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
      this.align = specifier.align === undefined ? ">" : specifier.align + "";
      this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
      this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? "" : specifier.type + "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width === undefined ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (i0 > 0) { if (!+s[i]) break out; i0 = 0; } break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": function(x, p) { return (x * 100).toFixed(p); },
      "b": function(x) { return Math.round(x).toString(2); },
      "c": function(x) { return x + ""; },
      "d": function(x) { return Math.round(x).toString(10); },
      "e": function(x, p) { return x.toExponential(p); },
      "f": function(x, p) { return x.toFixed(p); },
      "g": function(x, p) { return x.toPrecision(p); },
      "o": function(x) { return Math.round(x).toString(8); },
      "p": function(x, p) { return formatRounded(x * 100, p); },
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
      "x": function(x) { return Math.round(x).toString(16); }
    };

    function identity$2(x) {
      return x;
    }

    var map = Array.prototype.map,
        prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale$1(locale) {
      var group = locale.grouping === undefined || locale.thousands === undefined ? identity$2 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
          currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
          currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
          decimal = locale.decimal === undefined ? "." : locale.decimal + "",
          numerals = locale.numerals === undefined ? identity$2 : formatNumerals(map.call(locale.numerals, String)),
          percent = locale.percent === undefined ? "%" : locale.percent + "",
          minus = locale.minus === undefined ? "-" : locale.minus + "",
          nan = locale.nan === undefined ? "NaN" : locale.nan + "";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision === undefined ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Perform the initial formatting.
            var valueNegative = value < 0;
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero during formatting, treat as positive.
            if (valueNegative && +value === 0) valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;

            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale$1;
    var format;
    var formatPrefix;

    defaultLocale$1({
      decimal: ".",
      thousands: ",",
      grouping: [3],
      currency: ["$", ""],
      minus: "-"
    });

    function defaultLocale$1(definition) {
      locale$1 = formatLocale$1(definition);
      format = locale$1.format;
      formatPrefix = locale$1.formatPrefix;
      return locale$1;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain(),
            i0 = 0,
            i1 = d.length - 1,
            start = d[i0],
            stop = d[i1],
            step;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }

        step = tickIncrement(start, stop, count);

        if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
          step = tickIncrement(start, stop, count);
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
          step = tickIncrement(start, stop, count);
        }

        if (step > 0) {
          d[i0] = Math.floor(start / step) * step;
          d[i1] = Math.ceil(stop / step) * step;
          domain(d);
        } else if (step < 0) {
          d[i0] = Math.ceil(start * step) / step;
          d[i1] = Math.floor(stop * step) / step;
          domain(d);
        }

        return scale;
      };

      return scale;
    }

    function linear$1() {
      var scale = continuous();

      scale.copy = function() {
        return copy(scale, linear$1());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    function nice(domain, interval) {
      domain = domain.slice();

      var i0 = 0,
          i1 = domain.length - 1,
          x0 = domain[i0],
          x1 = domain[i1],
          t;

      if (x1 < x0) {
        t = i0, i0 = i1, i1 = t;
        t = x0, x0 = x1, x1 = t;
      }

      domain[i0] = interval.floor(x0);
      domain[i1] = interval.ceil(x1);
      return domain;
    }

    var durationSecond$1 = 1000,
        durationMinute$1 = durationSecond$1 * 60,
        durationHour$1 = durationMinute$1 * 60,
        durationDay$1 = durationHour$1 * 24,
        durationWeek$1 = durationDay$1 * 7,
        durationMonth = durationDay$1 * 30,
        durationYear = durationDay$1 * 365;

    function date$1(t) {
      return new Date(t);
    }

    function number$2(t) {
      return t instanceof Date ? +t : +new Date(+t);
    }

    function calendar(year, month, week, day, hour, minute, second, millisecond, format) {
      var scale = continuous(),
          invert = scale.invert,
          domain = scale.domain;

      var formatMillisecond = format(".%L"),
          formatSecond = format(":%S"),
          formatMinute = format("%I:%M"),
          formatHour = format("%I %p"),
          formatDay = format("%a %d"),
          formatWeek = format("%b %d"),
          formatMonth = format("%B"),
          formatYear = format("%Y");

      var tickIntervals = [
        [second,  1,      durationSecond$1],
        [second,  5,  5 * durationSecond$1],
        [second, 15, 15 * durationSecond$1],
        [second, 30, 30 * durationSecond$1],
        [minute,  1,      durationMinute$1],
        [minute,  5,  5 * durationMinute$1],
        [minute, 15, 15 * durationMinute$1],
        [minute, 30, 30 * durationMinute$1],
        [  hour,  1,      durationHour$1  ],
        [  hour,  3,  3 * durationHour$1  ],
        [  hour,  6,  6 * durationHour$1  ],
        [  hour, 12, 12 * durationHour$1  ],
        [   day,  1,      durationDay$1   ],
        [   day,  2,  2 * durationDay$1   ],
        [  week,  1,      durationWeek$1  ],
        [ month,  1,      durationMonth ],
        [ month,  3,  3 * durationMonth ],
        [  year,  1,      durationYear  ]
      ];

      function tickFormat(date) {
        return (second(date) < date ? formatMillisecond
            : minute(date) < date ? formatSecond
            : hour(date) < date ? formatMinute
            : day(date) < date ? formatHour
            : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
            : year(date) < date ? formatMonth
            : formatYear)(date);
      }

      function tickInterval(interval, start, stop) {
        if (interval == null) interval = 10;

        // If a desired tick count is specified, pick a reasonable tick interval
        // based on the extent of the domain and a rough estimate of tick size.
        // Otherwise, assume interval is already a time interval and use it.
        if (typeof interval === "number") {
          var target = Math.abs(stop - start) / interval,
              i = bisector(function(i) { return i[2]; }).right(tickIntervals, target),
              step;
          if (i === tickIntervals.length) {
            step = tickStep(start / durationYear, stop / durationYear, interval);
            interval = year;
          } else if (i) {
            i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
            step = i[1];
            interval = i[0];
          } else {
            step = Math.max(tickStep(start, stop, interval), 1);
            interval = millisecond;
          }
          return interval.every(step);
        }

        return interval;
      }

      scale.invert = function(y) {
        return new Date(invert(y));
      };

      scale.domain = function(_) {
        return arguments.length ? domain(Array.from(_, number$2)) : domain().map(date$1);
      };

      scale.ticks = function(interval) {
        var d = domain(),
            t0 = d[0],
            t1 = d[d.length - 1],
            r = t1 < t0,
            t;
        if (r) t = t0, t0 = t1, t1 = t;
        t = tickInterval(interval, t0, t1);
        t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
        return r ? t.reverse() : t;
      };

      scale.tickFormat = function(count, specifier) {
        return specifier == null ? tickFormat : format(specifier);
      };

      scale.nice = function(interval) {
        var d = domain();
        return (interval = tickInterval(interval, d[0], d[d.length - 1]))
            ? domain(nice(d, interval))
            : scale;
      };

      scale.copy = function() {
        return copy(scale, calendar(year, month, week, day, hour, minute, second, millisecond, format));
      };

      return scale;
    }

    function scaleTime() {
      return initRange.apply(calendar(year, month, sunday, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]), arguments);
    }

    /* src/BaseChart.svelte generated by Svelte v3.16.7 */

    const file = "src/BaseChart.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[33] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    // (148:12) {#each yTicks as tick}
    function create_each_block_2(ctx) {
    	let g;
    	let line;
    	let text_1;
    	let html_tag;
    	let raw_value = (/*tick*/ ctx[31] < 0 ? "&minus;" : "") + "";
    	let t0_value = Math.abs(/*tick*/ ctx[31]) + "";
    	let t0;
    	let t1;
    	let g_class_value;
    	let g_transform_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			line = svg_element("line");
    			text_1 = svg_element("text");
    			t0 = text(t0_value);
    			t1 = text("°C\n                    ");
    			attr_dev(line, "x2", "100%");
    			attr_dev(line, "class", "svelte-dtjmc3");
    			add_location(line, file, 151, 20, 5126);
    			html_tag = new HtmlTag(raw_value, t0);
    			attr_dev(text_1, "y", "-4");
    			attr_dev(text_1, "class", "svelte-dtjmc3");
    			add_location(text_1, file, 152, 20, 5165);
    			attr_dev(g, "class", g_class_value = "tick tick-" + /*tick*/ ctx[31] + " svelte-dtjmc3");
    			attr_dev(g, "transform", g_transform_value = "translate(0, " + (/*yScale*/ ctx[8](/*tick*/ ctx[31]) - /*padding*/ ctx[3].bottom) + ")");
    			add_location(g, file, 148, 16, 4979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, line);
    			append_dev(g, text_1);
    			html_tag.m(text_1);
    			append_dev(text_1, t0);
    			append_dev(text_1, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*yTicks*/ 1024 && raw_value !== (raw_value = (/*tick*/ ctx[31] < 0 ? "&minus;" : "") + "")) html_tag.p(raw_value);
    			if (dirty[0] & /*yTicks*/ 1024 && t0_value !== (t0_value = Math.abs(/*tick*/ ctx[31]) + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*yTicks*/ 1024 && g_class_value !== (g_class_value = "tick tick-" + /*tick*/ ctx[31] + " svelte-dtjmc3")) {
    				attr_dev(g, "class", g_class_value);
    			}

    			if (dirty[0] & /*yScale, yTicks, padding*/ 1288 && g_transform_value !== (g_transform_value = "translate(0, " + (/*yScale*/ ctx[8](/*tick*/ ctx[31]) - /*padding*/ ctx[3].bottom) + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(148:12) {#each yTicks as tick}",
    		ctx
    	});

    	return block;
    }

    // (166:20) {#if midMonth(tick) < $maxDate}
    function create_if_block(ctx) {
    	let g;
    	let text_1;

    	let t_value = (innerWidth > 400
    	? /*format*/ ctx[11](/*tick*/ ctx[31], /*i*/ ctx[33])
    	: /*formatMobile*/ ctx[12](/*tick*/ ctx[31], /*i*/ ctx[33])) + "";

    	let t;
    	let show_if = !/*i*/ ctx[33] && /*tick*/ ctx[31].getMonth() < 10 || !/*tick*/ ctx[31].getMonth();
    	let g_transform_value;
    	let if_block = show_if && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			if (if_block) if_block.c();
    			attr_dev(text_1, "y", "0");
    			attr_dev(text_1, "class", "svelte-dtjmc3");
    			add_location(text_1, file, 167, 28, 5803);
    			attr_dev(g, "transform", g_transform_value = "translate(" + (/*xScale*/ ctx[4](/*midMonth*/ ctx[14](/*tick*/ ctx[31])) - /*xScale*/ ctx[4](/*tick*/ ctx[31])) + ",0)");
    			add_location(g, file, 166, 24, 5706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, text_1);
    			append_dev(text_1, t);
    			if (if_block) if_block.m(g, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*format, xTicks, formatMobile*/ 6272 && t_value !== (t_value = (innerWidth > 400
    			? /*format*/ ctx[11](/*tick*/ ctx[31], /*i*/ ctx[33])
    			: /*formatMobile*/ ctx[12](/*tick*/ ctx[31], /*i*/ ctx[33])) + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*xTicks*/ 128) show_if = !/*i*/ ctx[33] && /*tick*/ ctx[31].getMonth() < 10 || !/*tick*/ ctx[31].getMonth();

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(g, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*xScale, xTicks*/ 144 && g_transform_value !== (g_transform_value = "translate(" + (/*xScale*/ ctx[4](/*midMonth*/ ctx[14](/*tick*/ ctx[31])) - /*xScale*/ ctx[4](/*tick*/ ctx[31])) + ",0)")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(166:20) {#if midMonth(tick) < $maxDate}",
    		ctx
    	});

    	return block;
    }

    // (171:28) {#if (!i && tick.getMonth() < 10) || !tick.getMonth()}
    function create_if_block_1(ctx) {
    	let text0;
    	let t0_value = /*tick*/ ctx[31].getFullYear() + "";
    	let t0;
    	let text1;
    	let t1_value = /*tick*/ ctx[31].getFullYear() + "";
    	let t1;

    	const block = {
    		c: function create() {
    			text0 = svg_element("text");
    			t0 = text(t0_value);
    			text1 = svg_element("text");
    			t1 = text(t1_value);
    			attr_dev(text0, "class", "year buffer svelte-dtjmc3");
    			attr_dev(text0, "y", "-20");
    			add_location(text0, file, 171, 32, 6060);
    			attr_dev(text1, "class", "year svelte-dtjmc3");
    			attr_dev(text1, "y", "-20");
    			add_location(text1, file, 172, 32, 6154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text0, anchor);
    			append_dev(text0, t0);
    			insert_dev(target, text1, anchor);
    			append_dev(text1, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*xTicks*/ 128 && t0_value !== (t0_value = /*tick*/ ctx[31].getFullYear() + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*xTicks*/ 128 && t1_value !== (t1_value = /*tick*/ ctx[31].getFullYear() + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text0);
    			if (detaching) detach_dev(text1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(171:28) {#if (!i && tick.getMonth() < 10) || !tick.getMonth()}",
    		ctx
    	});

    	return block;
    }

    // (163:12) {#each xTicks as tick, i}
    function create_each_block_1(ctx) {
    	let g;
    	let line;
    	let line_y__value;
    	let line_y__value_1;
    	let show_if = /*midMonth*/ ctx[14](/*tick*/ ctx[31]) < /*$maxDate*/ ctx[5];
    	let g_class_value;
    	let g_transform_value;
    	let if_block = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			line = svg_element("line");
    			if (if_block) if_block.c();
    			attr_dev(line, "y1", line_y__value = "-" + /*height*/ ctx[9]);
    			attr_dev(line, "y2", line_y__value_1 = "-" + /*padding*/ ctx[3].bottom);
    			attr_dev(line, "x1", "0");
    			attr_dev(line, "x2", "0");
    			attr_dev(line, "class", "svelte-dtjmc3");
    			add_location(line, file, 164, 20, 5569);
    			attr_dev(g, "class", g_class_value = "tick tick-" + /*tick*/ ctx[31] + " svelte-dtjmc3");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*xScale*/ ctx[4](/*tick*/ ctx[31]) + "," + /*height*/ ctx[9] + ")");
    			add_location(g, file, 163, 16, 5473);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, line);
    			if (if_block) if_block.m(g, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*height*/ 512 && line_y__value !== (line_y__value = "-" + /*height*/ ctx[9])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty[0] & /*padding*/ 8 && line_y__value_1 !== (line_y__value_1 = "-" + /*padding*/ ctx[3].bottom)) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty[0] & /*xTicks, $maxDate*/ 160) show_if = /*midMonth*/ ctx[14](/*tick*/ ctx[31]) < /*$maxDate*/ ctx[5];

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(g, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*xTicks*/ 128 && g_class_value !== (g_class_value = "tick tick-" + /*tick*/ ctx[31] + " svelte-dtjmc3")) {
    				attr_dev(g, "class", g_class_value);
    			}

    			if (dirty[0] & /*xScale, xTicks, height*/ 656 && g_transform_value !== (g_transform_value = "translate(" + /*xScale*/ ctx[4](/*tick*/ ctx[31]) + "," + /*height*/ ctx[9] + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(163:12) {#each xTicks as tick, i}",
    		ctx
    	});

    	return block;
    }

    // (181:8) {#each layers as layer}
    function create_each_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*layer*/ ctx[28];

    	function switch_props(ctx) {
    		return {
    			props: {
    				data: /*data*/ ctx[0],
    				grouped: /*grouped*/ ctx[2],
    				xScale: /*xScale*/ ctx[4],
    				yScale: /*yScale*/ ctx[8]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*data*/ 1) switch_instance_changes.data = /*data*/ ctx[0];
    			if (dirty[0] & /*grouped*/ 4) switch_instance_changes.grouped = /*grouped*/ ctx[2];
    			if (dirty[0] & /*xScale*/ 16) switch_instance_changes.xScale = /*xScale*/ ctx[4];
    			if (dirty[0] & /*yScale*/ 256) switch_instance_changes.yScale = /*yScale*/ ctx[8];

    			if (switch_value !== (switch_value = /*layer*/ ctx[28])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(181:8) {#each layers as layer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let svg;
    	let g0;
    	let g0_transform_value;
    	let g1;
    	let line;
    	let line_transform_value;
    	let div_resize_listener;
    	let current;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[26]);
    	let each_value_2 = /*yTicks*/ ctx[10];
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*xTicks*/ ctx[7];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*layers*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			g0 = svg_element("g");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			g1 = svg_element("g");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			line = svg_element("line");
    			attr_dev(g0, "class", "axis y-axis");
    			attr_dev(g0, "transform", g0_transform_value = "translate(0, " + /*padding*/ ctx[3].top + ")");
    			add_location(g0, file, 146, 8, 4864);
    			attr_dev(g1, "class", "axis x-axis svelte-dtjmc3");
    			add_location(g1, file, 161, 8, 5395);
    			attr_dev(line, "class", "zero svelte-dtjmc3");
    			attr_dev(line, "transform", line_transform_value = "translate(0," + /*yScale*/ ctx[8](0) + ")");
    			attr_dev(line, "x2", "100%");
    			add_location(line, file, 184, 8, 6491);
    			attr_dev(svg, "height", /*height*/ ctx[9]);
    			attr_dev(svg, "class", "svelte-dtjmc3");
    			add_location(svg, file, 144, 4, 4817);
    			attr_dev(div, "class", "chart svelte-dtjmc3");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[27].call(div));
    			add_location(div, file, 143, 0, 4762);
    			dispose = listen_dev(window, "resize", /*onwindowresize*/ ctx[26]);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, g0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(g0, null);
    			}

    			append_dev(svg, g1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(g1, null);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			append_dev(svg, line);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[27].bind(div));
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*yTicks, yScale, padding*/ 1288) {
    				each_value_2 = /*yTicks*/ ctx[10];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(g0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (!current || dirty[0] & /*padding*/ 8 && g0_transform_value !== (g0_transform_value = "translate(0, " + /*padding*/ ctx[3].top + ")")) {
    				attr_dev(g0, "transform", g0_transform_value);
    			}

    			if (dirty[0] & /*xTicks, xScale, height, midMonth, $maxDate, format, formatMobile, padding*/ 23224) {
    				each_value_1 = /*xTicks*/ ctx[7];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*layers, data, grouped, xScale, yScale*/ 279) {
    				each_value = /*layers*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(svg, line);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*yScale*/ 256 && line_transform_value !== (line_transform_value = "translate(0," + /*yScale*/ ctx[8](0) + ")")) {
    				attr_dev(line, "transform", line_transform_value);
    			}

    			if (!current || dirty[0] & /*height*/ 512) {
    				attr_dev(svg, "height", /*height*/ ctx[9]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			div_resize_listener.cancel();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $smoothNormalRangeWidth;
    	let $minDate;
    	let $maxDate;
    	let $chartWidth;
    	let $msg;
    	let $contextMinYear;
    	let $contextMaxYear;
    	let $normalRange;
    	let $innerWidth;
    	validate_store(smoothNormalRangeWidth, "smoothNormalRangeWidth");
    	component_subscribe($$self, smoothNormalRangeWidth, $$value => $$invalidate(19, $smoothNormalRangeWidth = $$value));
    	validate_store(minDate, "minDate");
    	component_subscribe($$self, minDate, $$value => $$invalidate(20, $minDate = $$value));
    	validate_store(maxDate, "maxDate");
    	component_subscribe($$self, maxDate, $$value => $$invalidate(5, $maxDate = $$value));
    	validate_store(chartWidth, "chartWidth");
    	component_subscribe($$self, chartWidth, $$value => $$invalidate(6, $chartWidth = $$value));
    	validate_store(msg, "msg");
    	component_subscribe($$self, msg, $$value => $$invalidate(21, $msg = $$value));
    	validate_store(contextMinYear, "contextMinYear");
    	component_subscribe($$self, contextMinYear, $$value => $$invalidate(22, $contextMinYear = $$value));
    	validate_store(contextMaxYear, "contextMaxYear");
    	component_subscribe($$self, contextMaxYear, $$value => $$invalidate(23, $contextMaxYear = $$value));
    	validate_store(normalRange, "normalRange");
    	component_subscribe($$self, normalRange, $$value => $$invalidate(24, $normalRange = $$value));
    	validate_store(innerWidth, "innerWidth");
    	component_subscribe($$self, innerWidth, $$value => $$invalidate(13, $innerWidth = $$value));
    	let { data = [] } = $$props;
    	let tMin = -29;
    	let tMax = 45;
    	let { layers = [] } = $$props;

    	const midMonth = d => {
    		return new Date(d.getTime() + (new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) - d) / 2);
    	};

    	const fmt = timeFormat("-%m-%d");
    	let grouped;
    	const writable_props = ["data", "layers"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BaseChart> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		innerWidth.set($innerWidth = window.innerWidth);
    	}

    	function div_elementresize_handler() {
    		$chartWidth = this.clientWidth;
    		chartWidth.set($chartWidth);
    	}

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("layers" in $$props) $$invalidate(1, layers = $$props.layers);
    	};

    	$$self.$capture_state = () => {
    		return {
    			data,
    			tMin,
    			tMax,
    			layers,
    			grouped,
    			dataClean,
    			dataSmooth,
    			$smoothNormalRangeWidth,
    			padding,
    			xScale,
    			$minDate,
    			$maxDate,
    			$chartWidth,
    			xTicks,
    			yScale,
    			height,
    			yTicks,
    			format,
    			$msg,
    			formatMobile,
    			$contextMinYear,
    			$contextMaxYear,
    			$normalRange,
    			$innerWidth
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("tMin" in $$props) $$invalidate(15, tMin = $$props.tMin);
    		if ("tMax" in $$props) $$invalidate(16, tMax = $$props.tMax);
    		if ("layers" in $$props) $$invalidate(1, layers = $$props.layers);
    		if ("grouped" in $$props) $$invalidate(2, grouped = $$props.grouped);
    		if ("dataClean" in $$props) $$invalidate(17, dataClean = $$props.dataClean);
    		if ("dataSmooth" in $$props) $$invalidate(18, dataSmooth = $$props.dataSmooth);
    		if ("$smoothNormalRangeWidth" in $$props) smoothNormalRangeWidth.set($smoothNormalRangeWidth = $$props.$smoothNormalRangeWidth);
    		if ("padding" in $$props) $$invalidate(3, padding = $$props.padding);
    		if ("xScale" in $$props) $$invalidate(4, xScale = $$props.xScale);
    		if ("$minDate" in $$props) minDate.set($minDate = $$props.$minDate);
    		if ("$maxDate" in $$props) maxDate.set($maxDate = $$props.$maxDate);
    		if ("$chartWidth" in $$props) chartWidth.set($chartWidth = $$props.$chartWidth);
    		if ("xTicks" in $$props) $$invalidate(7, xTicks = $$props.xTicks);
    		if ("yScale" in $$props) $$invalidate(8, yScale = $$props.yScale);
    		if ("height" in $$props) $$invalidate(9, height = $$props.height);
    		if ("yTicks" in $$props) $$invalidate(10, yTicks = $$props.yTicks);
    		if ("format" in $$props) $$invalidate(11, format = $$props.format);
    		if ("$msg" in $$props) msg.set($msg = $$props.$msg);
    		if ("formatMobile" in $$props) $$invalidate(12, formatMobile = $$props.formatMobile);
    		if ("$contextMinYear" in $$props) contextMinYear.set($contextMinYear = $$props.$contextMinYear);
    		if ("$contextMaxYear" in $$props) contextMaxYear.set($contextMaxYear = $$props.$contextMaxYear);
    		if ("$normalRange" in $$props) normalRange.set($normalRange = $$props.$normalRange);
    		if ("$innerWidth" in $$props) innerWidth.set($innerWidth = $$props.$innerWidth);
    	};

    	let dataClean;
    	let dataSmooth;
    	let padding;
    	let xScale;
    	let xTicks;
    	let yScale;
    	let yTicks;
    	let height;
    	let format;
    	let formatMobile;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*data*/ 1) {
    			 $$invalidate(17, dataClean = data.filter(d => d.tMin > -999 && d.tMax > -999));
    		}

    		if ($$self.$$.dirty[0] & /*$smoothNormalRangeWidth, dataClean*/ 655360) {
    			 $$invalidate(18, dataSmooth = $smoothNormalRangeWidth > 0
    			? dataClean.map((d, i) => {
    					return {
    						date: d.date,
    						dateRaw: d.dateRaw,
    						tMin: mean(dataClean.slice(Math.max(0, i - $smoothNormalRangeWidth), i + $smoothNormalRangeWidth + 1).map(d => d.tMin)),
    						tAvg: mean(dataClean.slice(Math.max(0, i - $smoothNormalRangeWidth), i + $smoothNormalRangeWidth + 1).map(d => d.tAvg)),
    						tMax: mean(dataClean.slice(Math.max(0, i - $smoothNormalRangeWidth), i + $smoothNormalRangeWidth + 1).map(d => d.tMax))
    					};
    				})
    			: dataClean);
    		}

    		if ($$self.$$.dirty[0] & /*$minDate, $maxDate, padding, $chartWidth*/ 1048680) {
    			 $$invalidate(4, xScale = scaleTime().domain([$minDate, $maxDate]).range([padding.left, $chartWidth - padding.right]));
    		}

    		if ($$self.$$.dirty[0] & /*xScale*/ 16) {
    			 $$invalidate(7, xTicks = xScale.ticks(month));
    		}

    		if ($$self.$$.dirty[0] & /*data, dataSmooth, $minDate, $maxDate, $contextMinYear, $contextMaxYear, tMin, tMax, $normalRange*/ 30769185) {
    			 {
    				const cache = group(data, d => d.dateRaw.substr(4));
    				const cacheSmooth = group(dataSmooth, d => d.dateRaw.substr(4));
    				$$invalidate(15, tMin = 99);
    				$$invalidate(16, tMax = -99);

    				$$invalidate(2, grouped = days($minDate, $maxDate).map(day => {
    					const dayFmt = fmt(day);
    					const groupedAll = cache.get(dayFmt);
    					const grouped = cacheSmooth.get(dayFmt).filter(d => d.date.getFullYear() >= $contextMinYear && d.date.getFullYear() < $contextMaxYear);
    					const tMinSorted = grouped.map(d => d.tMin).sort(ascending);
    					const tAvgSorted = grouped.map(d => d.tAvg).sort(ascending);
    					const tMaxSorted = grouped.map(d => d.tMax).sort(ascending);
    					const tMinAbs = min(groupedAll, d => d.tMin);
    					const tMaxAbs = max(groupedAll, d => d.tMax);
    					const dateRaw = day.getFullYear() + dayFmt;
    					const cur = data.find(d => d.dateRaw === dateRaw);
    					$$invalidate(15, tMin = Math.min(tMin, tMinAbs - 5));
    					$$invalidate(16, tMax = Math.max(tMax, tMaxAbs + 5));

    					if (cur) {
    						$$invalidate(15, tMin = Math.min(tMin, cur.tMin - 5));
    						$$invalidate(16, tMax = Math.max(tMax, cur.tMax + 5));
    					}

    					const tAvg = quantileSorted(tAvgSorted, 0.5);

    					return {
    						date: day,
    						dateRaw,
    						grouped,
    						tMin: $normalRange < 100
    						? quantileSorted(tMinSorted, $normalRange / 100)
    						: tAvg,
    						tAvg,
    						tMax: $normalRange < 100
    						? quantileSorted(tMaxSorted, 1 - $normalRange / 100)
    						: tAvg,
    						tMinAbs,
    						tMaxAbs,
    						tMinSorted,
    						tAvgSorted,
    						tMaxSorted
    					};
    				}));

    				while (tMax - tMin < 40) {
    					$$invalidate(16, tMax++, tMax);
    					$$invalidate(15, tMin--, tMin);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$chartWidth*/ 64) {
    			 $$invalidate(9, height = Math.max(450, $chartWidth * ($chartWidth > 800 ? 0.35 : $chartWidth > 500 ? 0.7 : 1)));
    		}

    		if ($$self.$$.dirty[0] & /*tMin, tMax, height, padding*/ 98824) {
    			 $$invalidate(8, yScale = linear$1().domain([tMin, tMax]).range([height - padding.bottom, padding.top]));
    		}

    		if ($$self.$$.dirty[0] & /*yScale*/ 256) {
    			 $$invalidate(10, yTicks = yScale.ticks(6));
    		}

    		if ($$self.$$.dirty[0] & /*$msg*/ 2097152) {
    			 $$invalidate(11, format = (d, i) => $msg.monthLong[d.getMonth()]);
    		}

    		if ($$self.$$.dirty[0] & /*$msg*/ 2097152) {
    			 $$invalidate(12, formatMobile = (d, i) => $msg.monthShort[d.getMonth()]);
    		}
    	};

    	 $$invalidate(3, padding = {
    		top: 20,
    		right: 5,
    		bottom: 20,
    		left: innerWidth < 400 ? 30 : 40
    	});

    	return [
    		data,
    		layers,
    		grouped,
    		padding,
    		xScale,
    		$maxDate,
    		$chartWidth,
    		xTicks,
    		yScale,
    		height,
    		yTicks,
    		format,
    		formatMobile,
    		$innerWidth,
    		midMonth,
    		tMin,
    		tMax,
    		dataClean,
    		dataSmooth,
    		$smoothNormalRangeWidth,
    		$minDate,
    		$msg,
    		$contextMinYear,
    		$contextMaxYear,
    		$normalRange,
    		fmt,
    		onwindowresize,
    		div_elementresize_handler
    	];
    }

    class BaseChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 0, layers: 1 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BaseChart",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get data() {
    		throw new Error("<BaseChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<BaseChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layers() {
    		throw new Error("<BaseChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layers(value) {
    		throw new Error("<BaseChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var pi = Math.PI,
        tau = 2 * pi,
        epsilon = 1e-6,
        tauEpsilon = tau - epsilon;

    function Path() {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null; // end of current subpath
      this._ = "";
    }

    function path() {
      return new Path;
    }

    Path.prototype = path.prototype = {
      constructor: Path,
      moveTo: function(x, y) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
      },
      closePath: function() {
        if (this._x1 !== null) {
          this._x1 = this._x0, this._y1 = this._y0;
          this._ += "Z";
        }
      },
      lineTo: function(x, y) {
        this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      quadraticCurveTo: function(x1, y1, x, y) {
        this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      bezierCurveTo: function(x1, y1, x2, y2, x, y) {
        this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      arcTo: function(x1, y1, x2, y2, r) {
        x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
        var x0 = this._x1,
            y0 = this._y1,
            x21 = x2 - x1,
            y21 = y2 - y1,
            x01 = x0 - x1,
            y01 = y0 - y1,
            l01_2 = x01 * x01 + y01 * y01;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x1,y1).
        if (this._x1 === null) {
          this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
        else if (!(l01_2 > epsilon));

        // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
        // Equivalently, is (x1,y1) coincident with (x2,y2)?
        // Or, is the radius zero? Line to (x1,y1).
        else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
          var x20 = x2 - x0,
              y20 = y2 - y0,
              l21_2 = x21 * x21 + y21 * y21,
              l20_2 = x20 * x20 + y20 * y20,
              l21 = Math.sqrt(l21_2),
              l01 = Math.sqrt(l01_2),
              l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
              t01 = l / l01,
              t21 = l / l21;

          // If the start tangent is not coincident with (x0,y0), line to.
          if (Math.abs(t01 - 1) > epsilon) {
            this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
          }

          this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
        }
      },
      arc: function(x, y, r, a0, a1, ccw) {
        x = +x, y = +y, r = +r, ccw = !!ccw;
        var dx = r * Math.cos(a0),
            dy = r * Math.sin(a0),
            x0 = x + dx,
            y0 = y + dy,
            cw = 1 ^ ccw,
            da = ccw ? a0 - a1 : a1 - a0;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x0,y0).
        if (this._x1 === null) {
          this._ += "M" + x0 + "," + y0;
        }

        // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
        else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
          this._ += "L" + x0 + "," + y0;
        }

        // Is this arc empty? We’re done.
        if (!r) return;

        // Does the angle go the wrong way? Flip the direction.
        if (da < 0) da = da % tau + tau;

        // Is this a complete circle? Draw two arcs to complete the circle.
        if (da > tauEpsilon) {
          this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
        }

        // Is this arc non-empty? Draw an arc!
        else if (da > epsilon) {
          this._ += "A" + r + "," + r + ",0," + (+(da >= pi)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
        }
      },
      rect: function(x, y, w, h) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
      },
      toString: function() {
        return this._;
      }
    };

    function constant$2(x) {
      return function constant() {
        return x;
      };
    }

    function Linear(context) {
      this._context = context;
    }

    Linear.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; // proceed
          default: this._context.lineTo(x, y); break;
        }
      }
    };

    function curveLinear(context) {
      return new Linear(context);
    }

    function x(p) {
      return p[0];
    }

    function y(p) {
      return p[1];
    }

    function line() {
      var x$1 = x,
          y$1 = y,
          defined = constant$2(true),
          context = null,
          curve = curveLinear,
          output = null;

      function line(data) {
        var i,
            n = data.length,
            d,
            defined0 = false,
            buffer;

        if (context == null) output = curve(buffer = path());

        for (i = 0; i <= n; ++i) {
          if (!(i < n && defined(d = data[i], i, data)) === defined0) {
            if (defined0 = !defined0) output.lineStart();
            else output.lineEnd();
          }
          if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
        }

        if (buffer) return output = null, buffer + "" || null;
      }

      line.x = function(_) {
        return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant$2(+_), line) : x$1;
      };

      line.y = function(_) {
        return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant$2(+_), line) : y$1;
      };

      line.defined = function(_) {
        return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), line) : defined;
      };

      line.curve = function(_) {
        return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
      };

      line.context = function(_) {
        return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
      };

      return line;
    }

    function area() {
      var x0 = x,
          x1 = null,
          y0 = constant$2(0),
          y1 = y,
          defined = constant$2(true),
          context = null,
          curve = curveLinear,
          output = null;

      function area(data) {
        var i,
            j,
            k,
            n = data.length,
            d,
            defined0 = false,
            buffer,
            x0z = new Array(n),
            y0z = new Array(n);

        if (context == null) output = curve(buffer = path());

        for (i = 0; i <= n; ++i) {
          if (!(i < n && defined(d = data[i], i, data)) === defined0) {
            if (defined0 = !defined0) {
              j = i;
              output.areaStart();
              output.lineStart();
            } else {
              output.lineEnd();
              output.lineStart();
              for (k = i - 1; k >= j; --k) {
                output.point(x0z[k], y0z[k]);
              }
              output.lineEnd();
              output.areaEnd();
            }
          }
          if (defined0) {
            x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
            output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
          }
        }

        if (buffer) return output = null, buffer + "" || null;
      }

      function arealine() {
        return line().defined(defined).curve(curve).context(context);
      }

      area.x = function(_) {
        return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), x1 = null, area) : x0;
      };

      area.x0 = function(_) {
        return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), area) : x0;
      };

      area.x1 = function(_) {
        return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : x1;
      };

      area.y = function(_) {
        return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), y1 = null, area) : y0;
      };

      area.y0 = function(_) {
        return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), area) : y0;
      };

      area.y1 = function(_) {
        return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : y1;
      };

      area.lineX0 =
      area.lineY0 = function() {
        return arealine().x(x0).y(y0);
      };

      area.lineY1 = function() {
        return arealine().x(x0).y(y1);
      };

      area.lineX1 = function() {
        return arealine().x(x1).y(y0);
      };

      area.defined = function(_) {
        return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), area) : defined;
      };

      area.curve = function(_) {
        return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
      };

      area.context = function(_) {
        return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
      };

      return area;
    }

    function point(that, x, y) {
      that._context.bezierCurveTo(
        (2 * that._x0 + that._x1) / 3,
        (2 * that._y0 + that._y1) / 3,
        (that._x0 + 2 * that._x1) / 3,
        (that._y0 + 2 * that._y1) / 3,
        (that._x0 + 4 * that._x1 + x) / 6,
        (that._y0 + 4 * that._y1 + y) / 6
      );
    }

    function Basis(context) {
      this._context = context;
    }

    Basis.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 =
        this._y0 = this._y1 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 3: point(this, this._x1, this._y1); // proceed
          case 2: this._context.lineTo(this._x1, this._y1); break;
        }
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; break;
          case 2: this._point = 3; this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
          default: point(this, x, y); break;
        }
        this._x0 = this._x1, this._x1 = x;
        this._y0 = this._y1, this._y1 = y;
      }
    };

    function curveBasis(context) {
      return new Basis(context);
    }

    function Step(context, t) {
      this._context = context;
      this._t = t;
    }

    Step.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x = this._y = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; // proceed
          default: {
            if (this._t <= 0) {
              this._context.lineTo(this._x, y);
              this._context.lineTo(x, y);
            } else {
              var x1 = this._x * (1 - this._t) + x * this._t;
              this._context.lineTo(x1, this._y);
              this._context.lineTo(x1, y);
            }
            break;
          }
        }
        this._x = x, this._y = y;
      }
    };

    function curveStep(context) {
      return new Step(context, 0.5);
    }

    /* src/layers/Steps.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/layers/Steps.svelte";

    function create_fragment$1(ctx) {
    	let path_1;

    	const block = {
    		c: function create() {
    			path_1 = svg_element("path");
    			attr_dev(path_1, "d", /*path*/ ctx[0]);
    			add_location(path_1, file$1, 17, 0, 350);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path_1, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*path*/ 1) {
    				attr_dev(path_1, "d", /*path*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { low = "tMin" } = $$props;
    	let { high = "tMax" } = $$props;
    	let { xScale } = $$props;
    	let { yScale } = $$props;
    	let { data } = $$props;
    	const writable_props = ["low", "high", "xScale", "yScale", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Steps> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("low" in $$props) $$invalidate(1, low = $$props.low);
    		if ("high" in $$props) $$invalidate(2, high = $$props.high);
    		if ("xScale" in $$props) $$invalidate(3, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(4, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { low, high, xScale, yScale, data, path };
    	};

    	$$self.$inject_state = $$props => {
    		if ("low" in $$props) $$invalidate(1, low = $$props.low);
    		if ("high" in $$props) $$invalidate(2, high = $$props.high);
    		if ("xScale" in $$props) $$invalidate(3, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(4, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    		if ("path" in $$props) $$invalidate(0, path = $$props.path);
    	};

    	let path;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xScale, yScale, low, high, data*/ 62) {
    			 $$invalidate(0, path = area().curve(curveStep).x(d => xScale(d.date)).y0(d => yScale(d[low])).y1(d => yScale(d[high]))(data));
    		}
    	};

    	return [path, low, high, xScale, yScale, data];
    }

    class Steps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			low: 1,
    			high: 2,
    			xScale: 3,
    			yScale: 4,
    			data: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Steps",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*xScale*/ ctx[3] === undefined && !("xScale" in props)) {
    			console.warn("<Steps> was created without expected prop 'xScale'");
    		}

    		if (/*yScale*/ ctx[4] === undefined && !("yScale" in props)) {
    			console.warn("<Steps> was created without expected prop 'yScale'");
    		}

    		if (/*data*/ ctx[5] === undefined && !("data" in props)) {
    			console.warn("<Steps> was created without expected prop 'data'");
    		}
    	}

    	get low() {
    		throw new Error("<Steps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set low(value) {
    		throw new Error("<Steps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get high() {
    		throw new Error("<Steps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set high(value) {
    		throw new Error("<Steps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xScale() {
    		throw new Error("<Steps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xScale(value) {
    		throw new Error("<Steps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yScale() {
    		throw new Error("<Steps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yScale(value) {
    		throw new Error("<Steps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Steps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Steps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layers/RecordTemperatures.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/layers/RecordTemperatures.svelte";

    function create_fragment$2(ctx) {
    	let g;
    	let current;

    	const steps = new Steps({
    			props: {
    				xScale: /*xScale*/ ctx[0],
    				yScale: /*yScale*/ ctx[1],
    				data: /*records*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			create_component(steps.$$.fragment);
    			attr_dev(g, "class", "svelte-19ej34d");
    			add_location(g, file$2, 24, 0, 396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			mount_component(steps, g, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const steps_changes = {};
    			if (dirty & /*xScale*/ 1) steps_changes.xScale = /*xScale*/ ctx[0];
    			if (dirty & /*yScale*/ 2) steps_changes.yScale = /*yScale*/ ctx[1];
    			if (dirty & /*records*/ 4) steps_changes.data = /*records*/ ctx[2];
    			steps.$set(steps_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(steps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(steps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_component(steps);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { xScale } = $$props;
    	let { yScale } = $$props;
    	let { data } = $$props;
    	let { grouped } = $$props;
    	const writable_props = ["xScale", "yScale", "data", "grouped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RecordTemperatures> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("xScale" in $$props) $$invalidate(0, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(1, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(4, grouped = $$props.grouped);
    	};

    	$$self.$capture_state = () => {
    		return { xScale, yScale, data, grouped, records };
    	};

    	$$self.$inject_state = $$props => {
    		if ("xScale" in $$props) $$invalidate(0, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(1, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(4, grouped = $$props.grouped);
    		if ("records" in $$props) $$invalidate(2, records = $$props.records);
    	};

    	let records;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*grouped*/ 16) {
    			 $$invalidate(2, records = grouped.map(d => {
    				return {
    					date: d.date,
    					tMin: d.tMinAbs,
    					tMax: d.tMaxAbs
    				};
    			}));
    		}
    	};

    	return [xScale, yScale, records, data, grouped];
    }

    class RecordTemperatures extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			xScale: 0,
    			yScale: 1,
    			data: 3,
    			grouped: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RecordTemperatures",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*xScale*/ ctx[0] === undefined && !("xScale" in props)) {
    			console.warn("<RecordTemperatures> was created without expected prop 'xScale'");
    		}

    		if (/*yScale*/ ctx[1] === undefined && !("yScale" in props)) {
    			console.warn("<RecordTemperatures> was created without expected prop 'yScale'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<RecordTemperatures> was created without expected prop 'data'");
    		}

    		if (/*grouped*/ ctx[4] === undefined && !("grouped" in props)) {
    			console.warn("<RecordTemperatures> was created without expected prop 'grouped'");
    		}
    	}

    	get xScale() {
    		throw new Error("<RecordTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xScale(value) {
    		throw new Error("<RecordTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yScale() {
    		throw new Error("<RecordTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yScale(value) {
    		throw new Error("<RecordTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<RecordTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<RecordTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grouped() {
    		throw new Error("<RecordTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grouped(value) {
    		throw new Error("<RecordTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layers/NormalTemperature.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/layers/NormalTemperature.svelte";

    function create_fragment$3(ctx) {
    	let g;
    	let path_1;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			path_1 = svg_element("path");
    			attr_dev(path_1, "d", /*pathData*/ ctx[0]);
    			attr_dev(path_1, "class", "svelte-1cmn9dm");
    			add_location(path_1, file$3, 36, 4, 742);
    			attr_dev(g, "class", "normal-temp");
    			add_location(g, file$3, 34, 0, 662);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, path_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pathData*/ 1) {
    				attr_dev(path_1, "d", /*pathData*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { xScale } = $$props;
    	let { yScale } = $$props;
    	let { data } = $$props;
    	let { grouped } = $$props;
    	const writable_props = ["xScale", "yScale", "data", "grouped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NormalTemperature> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("xScale" in $$props) $$invalidate(1, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(2, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(4, grouped = $$props.grouped);
    	};

    	$$self.$capture_state = () => {
    		return {
    			xScale,
    			yScale,
    			data,
    			grouped,
    			pathData,
    			path
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("xScale" in $$props) $$invalidate(1, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(2, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(4, grouped = $$props.grouped);
    		if ("pathData" in $$props) $$invalidate(0, pathData = $$props.pathData);
    		if ("path" in $$props) $$invalidate(5, path = $$props.path);
    	};

    	let pathData;
    	let path;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xScale, yScale*/ 6) {
    			 $$invalidate(5, path = line().x(d => xScale(d.date)).y(d => yScale(d.tAvg)).curve(curveBasis));
    		}

    		if ($$self.$$.dirty & /*path, grouped*/ 48) {
    			 $$invalidate(0, pathData = path(grouped));
    		}
    	};

    	return [pathData, xScale, yScale, data, grouped];
    }

    class NormalTemperature extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			xScale: 1,
    			yScale: 2,
    			data: 3,
    			grouped: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NormalTemperature",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*xScale*/ ctx[1] === undefined && !("xScale" in props)) {
    			console.warn("<NormalTemperature> was created without expected prop 'xScale'");
    		}

    		if (/*yScale*/ ctx[2] === undefined && !("yScale" in props)) {
    			console.warn("<NormalTemperature> was created without expected prop 'yScale'");
    		}

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console.warn("<NormalTemperature> was created without expected prop 'data'");
    		}

    		if (/*grouped*/ ctx[4] === undefined && !("grouped" in props)) {
    			console.warn("<NormalTemperature> was created without expected prop 'grouped'");
    		}
    	}

    	get xScale() {
    		throw new Error("<NormalTemperature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xScale(value) {
    		throw new Error("<NormalTemperature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yScale() {
    		throw new Error("<NormalTemperature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yScale(value) {
    		throw new Error("<NormalTemperature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<NormalTemperature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<NormalTemperature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grouped() {
    		throw new Error("<NormalTemperature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grouped(value) {
    		throw new Error("<NormalTemperature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layers/NormalTemperatureRange.svelte generated by Svelte v3.16.7 */
    const file$4 = "src/layers/NormalTemperatureRange.svelte";

    function create_fragment$4(ctx) {
    	let g;
    	let current;

    	const steps = new Steps({
    			props: {
    				xScale: /*xScale*/ ctx[0],
    				yScale: /*yScale*/ ctx[1],
    				data: /*normalRangeData*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			create_component(steps.$$.fragment);
    			attr_dev(g, "class", "normal-temp-range svelte-1q0l0k4");
    			toggle_class(g, "faint", /*$showAnomalies*/ ctx[3]);
    			add_location(g, file$4, 24, 0, 464);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			mount_component(steps, g, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const steps_changes = {};
    			if (dirty & /*xScale*/ 1) steps_changes.xScale = /*xScale*/ ctx[0];
    			if (dirty & /*yScale*/ 2) steps_changes.yScale = /*yScale*/ ctx[1];
    			if (dirty & /*normalRangeData*/ 4) steps_changes.data = /*normalRangeData*/ ctx[2];
    			steps.$set(steps_changes);

    			if (dirty & /*$showAnomalies*/ 8) {
    				toggle_class(g, "faint", /*$showAnomalies*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(steps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(steps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_component(steps);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $showAnomalies;
    	validate_store(showAnomalies, "showAnomalies");
    	component_subscribe($$self, showAnomalies, $$value => $$invalidate(3, $showAnomalies = $$value));
    	let { xScale } = $$props;
    	let { yScale } = $$props;
    	let { data } = $$props;
    	let { grouped } = $$props;
    	const writable_props = ["xScale", "yScale", "data", "grouped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NormalTemperatureRange> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("xScale" in $$props) $$invalidate(0, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(1, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(5, grouped = $$props.grouped);
    	};

    	$$self.$capture_state = () => {
    		return {
    			xScale,
    			yScale,
    			data,
    			grouped,
    			normalRangeData,
    			$showAnomalies
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("xScale" in $$props) $$invalidate(0, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(1, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(5, grouped = $$props.grouped);
    		if ("normalRangeData" in $$props) $$invalidate(2, normalRangeData = $$props.normalRangeData);
    		if ("$showAnomalies" in $$props) showAnomalies.set($showAnomalies = $$props.$showAnomalies);
    	};

    	let normalRangeData;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*grouped*/ 32) {
    			 $$invalidate(2, normalRangeData = grouped);
    		}
    	};

    	return [xScale, yScale, normalRangeData, $showAnomalies, data, grouped];
    }

    class NormalTemperatureRange extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			xScale: 0,
    			yScale: 1,
    			data: 4,
    			grouped: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NormalTemperatureRange",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*xScale*/ ctx[0] === undefined && !("xScale" in props)) {
    			console.warn("<NormalTemperatureRange> was created without expected prop 'xScale'");
    		}

    		if (/*yScale*/ ctx[1] === undefined && !("yScale" in props)) {
    			console.warn("<NormalTemperatureRange> was created without expected prop 'yScale'");
    		}

    		if (/*data*/ ctx[4] === undefined && !("data" in props)) {
    			console.warn("<NormalTemperatureRange> was created without expected prop 'data'");
    		}

    		if (/*grouped*/ ctx[5] === undefined && !("grouped" in props)) {
    			console.warn("<NormalTemperatureRange> was created without expected prop 'grouped'");
    		}
    	}

    	get xScale() {
    		throw new Error("<NormalTemperatureRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xScale(value) {
    		throw new Error("<NormalTemperatureRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yScale() {
    		throw new Error("<NormalTemperatureRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yScale(value) {
    		throw new Error("<NormalTemperatureRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<NormalTemperatureRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<NormalTemperatureRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grouped() {
    		throw new Error("<NormalTemperatureRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grouped(value) {
    		throw new Error("<NormalTemperatureRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function clientPoint(node, event) {
      var svg = node.ownerSVGElement || node;

      if (svg.createSVGPoint) {
        var point = svg.createSVGPoint();
        point.x = event.clientX, point.y = event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        return [point.x, point.y];
      }

      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }

    /* src/layers/CurrentTemperatures.svelte generated by Svelte v3.16.7 */
    const file$5 = "src/layers/CurrentTemperatures.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (75:12) {:else}
    function create_else_block(ctx) {
    	let line;
    	let line_y__value;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "y1", line_y__value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin));
    			attr_dev(line, "y2", line_y__value_1 = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax));
    			attr_dev(line, "class", "svelte-1tgjoq6");
    			add_location(line, file$5, 75, 16, 2687);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value !== (line_y__value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin))) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value_1 !== (line_y__value_1 = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax))) {
    				attr_dev(line, "y2", line_y__value_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(75:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (62:12) {#if $showAnomalies}
    function create_if_block_2(ctx) {
    	let if_block0_anchor;
    	let if_block1_anchor;
    	let if_block2_anchor;
    	let if_block0 = /*d*/ ctx[16].tMin < /*d*/ ctx[16].trendMin && create_if_block_5(ctx);
    	let if_block1 = /*d*/ ctx[16].tMax > /*d*/ ctx[16].trendMax && create_if_block_4(ctx);
    	let if_block2 = /*d*/ ctx[16].tMin < /*d*/ ctx[16].trendMax && /*d*/ ctx[16].tMax > /*d*/ ctx[16].trendMin && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, if_block0_anchor, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*d*/ ctx[16].tMin < /*d*/ ctx[16].trendMin) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(if_block0_anchor.parentNode, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*d*/ ctx[16].tMax > /*d*/ ctx[16].trendMax) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*d*/ ctx[16].tMin < /*d*/ ctx[16].trendMax && /*d*/ ctx[16].tMax > /*d*/ ctx[16].trendMin) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(if_block0_anchor);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(62:12) {#if $showAnomalies}",
    		ctx
    	});

    	return block;
    }

    // (63:16) {#if d.tMin < d.trendMin}
    function create_if_block_5(ctx) {
    	let line;
    	let line_y__value;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "class", "colder svelte-1tgjoq6");
    			attr_dev(line, "y1", line_y__value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin));
    			attr_dev(line, "y2", line_y__value_1 = /*yScale*/ ctx[1](Math.min(/*d*/ ctx[16].tMax, /*d*/ ctx[16].trendMin)));
    			add_location(line, file$5, 63, 20, 2086);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value !== (line_y__value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin))) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value_1 !== (line_y__value_1 = /*yScale*/ ctx[1](Math.min(/*d*/ ctx[16].tMax, /*d*/ ctx[16].trendMin)))) {
    				attr_dev(line, "y2", line_y__value_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(63:16) {#if d.tMin < d.trendMin}",
    		ctx
    	});

    	return block;
    }

    // (66:16) {#if d.tMax > d.trendMax}
    function create_if_block_4(ctx) {
    	let line;
    	let line_y__value;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "class", "hotter svelte-1tgjoq6");
    			attr_dev(line, "y1", line_y__value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax));
    			attr_dev(line, "y2", line_y__value_1 = /*yScale*/ ctx[1](Math.max(/*d*/ ctx[16].tMin, /*d*/ ctx[16].trendMax)));
    			add_location(line, file$5, 66, 20, 2256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value !== (line_y__value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax))) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value_1 !== (line_y__value_1 = /*yScale*/ ctx[1](Math.max(/*d*/ ctx[16].tMin, /*d*/ ctx[16].trendMax)))) {
    				attr_dev(line, "y2", line_y__value_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(66:16) {#if d.tMax > d.trendMax}",
    		ctx
    	});

    	return block;
    }

    // (69:16) {#if d.tMin < d.trendMax && d.tMax > d.trendMin}
    function create_if_block_3(ctx) {
    	let line;
    	let line_y__value;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "class", "normal svelte-1tgjoq6");
    			attr_dev(line, "y1", line_y__value = /*yScale*/ ctx[1](Math.max(/*d*/ ctx[16].trendMin, /*d*/ ctx[16].tMin)));
    			attr_dev(line, "y2", line_y__value_1 = /*yScale*/ ctx[1](Math.min(/*d*/ ctx[16].trendMax, /*d*/ ctx[16].tMax)));
    			add_location(line, file$5, 69, 20, 2449);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value !== (line_y__value = /*yScale*/ ctx[1](Math.max(/*d*/ ctx[16].trendMin, /*d*/ ctx[16].tMin)))) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*yScale, currentTempData*/ 34 && line_y__value_1 !== (line_y__value_1 = /*yScale*/ ctx[1](Math.min(/*d*/ ctx[16].trendMax, /*d*/ ctx[16].tMax)))) {
    				attr_dev(line, "y2", line_y__value_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(69:16) {#if d.tMin < d.trendMax && d.tMax > d.trendMin}",
    		ctx
    	});

    	return block;
    }

    // (85:12) {#if highlight && sameDay(highlight, d.date)}
    function create_if_block$1(ctx) {
    	let text0;
    	let t0_value = /*fmt*/ ctx[4](/*d*/ ctx[16].date) + "";
    	let t0;
    	let text0_y_value;
    	let text1;
    	let t1_value = /*d*/ ctx[16].tMax + "";
    	let t1;
    	let t2;
    	let text1_y_value;
    	let text2;
    	let t3_value = /*d*/ ctx[16].tMin + "";
    	let t3;
    	let t4;
    	let text2_y_value;
    	let show_if = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin) - /*yScale*/ ctx[1](/*d*/ ctx[16].tMax) > 30;
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			text0 = svg_element("text");
    			t0 = text(t0_value);
    			text1 = svg_element("text");
    			t1 = text(t1_value);
    			t2 = text("°C");
    			text2 = svg_element("text");
    			t3 = text(t3_value);
    			t4 = text("°C");
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(text0, "class", "date svelte-1tgjoq6");
    			attr_dev(text0, "y", text0_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax) - 25);
    			add_location(text0, file$5, 85, 16, 3216);
    			attr_dev(text1, "y", text1_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax) - 5);
    			attr_dev(text1, "class", "svelte-1tgjoq6");
    			add_location(text1, file$5, 86, 16, 3296);
    			attr_dev(text2, "class", "min svelte-1tgjoq6");
    			attr_dev(text2, "y", text2_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin) + 5);
    			add_location(text2, file$5, 87, 16, 3359);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text0, anchor);
    			append_dev(text0, t0);
    			insert_dev(target, text1, anchor);
    			append_dev(text1, t1);
    			append_dev(text1, t2);
    			insert_dev(target, text2, anchor);
    			append_dev(text2, t3);
    			append_dev(text2, t4);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*fmt, currentTempData*/ 48 && t0_value !== (t0_value = /*fmt*/ ctx[4](/*d*/ ctx[16].date) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*yScale, currentTempData*/ 34 && text0_y_value !== (text0_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax) - 25)) {
    				attr_dev(text0, "y", text0_y_value);
    			}

    			if (dirty & /*currentTempData*/ 32 && t1_value !== (t1_value = /*d*/ ctx[16].tMax + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*yScale, currentTempData*/ 34 && text1_y_value !== (text1_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMax) - 5)) {
    				attr_dev(text1, "y", text1_y_value);
    			}

    			if (dirty & /*currentTempData*/ 32 && t3_value !== (t3_value = /*d*/ ctx[16].tMin + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*yScale, currentTempData*/ 34 && text2_y_value !== (text2_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin) + 5)) {
    				attr_dev(text2, "y", text2_y_value);
    			}

    			if (dirty & /*yScale, currentTempData*/ 34) show_if = /*yScale*/ ctx[1](/*d*/ ctx[16].tMin) - /*yScale*/ ctx[1](/*d*/ ctx[16].tMax) > 30;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text0);
    			if (detaching) detach_dev(text1);
    			if (detaching) detach_dev(text2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(85:12) {#if highlight && sameDay(highlight, d.date)}",
    		ctx
    	});

    	return block;
    }

    // (89:16) {#if yScale(d.tMin) - yScale(d.tMax) > 30}
    function create_if_block_1$1(ctx) {
    	let text_1;
    	let t0_value = /*d*/ ctx[16].tAvg + "";
    	let t0;
    	let t1;
    	let text_1_y_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t0 = text(t0_value);
    			t1 = text("°C");
    			attr_dev(text_1, "class", "avg svelte-1tgjoq6");
    			attr_dev(text_1, "x", "5");
    			attr_dev(text_1, "y", text_1_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tAvg));
    			add_location(text_1, file$5, 89, 20, 3497);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t0);
    			append_dev(text_1, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentTempData*/ 32 && t0_value !== (t0_value = /*d*/ ctx[16].tAvg + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*yScale, currentTempData*/ 34 && text_1_y_value !== (text_1_y_value = /*yScale*/ ctx[1](/*d*/ ctx[16].tAvg))) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(89:16) {#if yScale(d.tMin) - yScale(d.tMax) > 30}",
    		ctx
    	});

    	return block;
    }

    // (56:4) {#each currentTempData as d}
    function create_each_block$1(ctx) {
    	let g;
    	let circle;
    	let circle_r_value;
    	let circle_transform_value;
    	let show_if = /*highlight*/ ctx[3] && sameDay(/*highlight*/ ctx[3], /*d*/ ctx[16].date);
    	let g_transform_value;

    	function select_block_type(ctx, dirty) {
    		if (/*$showAnomalies*/ ctx[6]) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			if_block0.c();
    			circle = svg_element("circle");
    			if (if_block1) if_block1.c();

    			attr_dev(circle, "r", circle_r_value = /*highlight*/ ctx[3] && sameDay(/*highlight*/ ctx[3], /*d*/ ctx[16].date)
    			? 3
    			: 2);

    			attr_dev(circle, "transform", circle_transform_value = "translate(0," + /*yScale*/ ctx[1](/*d*/ ctx[16].tAvg) + ")");
    			attr_dev(circle, "class", "svelte-1tgjoq6");
    			toggle_class(circle, "hotter", /*$showAnomalies*/ ctx[6] && /*d*/ ctx[16].tAvg > /*d*/ ctx[16].trendMax);
    			toggle_class(circle, "colder", /*$showAnomalies*/ ctx[6] && /*d*/ ctx[16].tAvg < /*d*/ ctx[16].trendMin);
    			toggle_class(circle, "normal", /*$showAnomalies*/ ctx[6] && /*d*/ ctx[16].tAvg >= /*d*/ ctx[16].trendMin && /*d*/ ctx[16].tAvg <= /*d*/ ctx[16].trendMax);
    			add_location(circle, file$5, 78, 12, 2767);
    			attr_dev(g, "class", "day svelte-1tgjoq6");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*xScale*/ ctx[0](/*d*/ ctx[16].date) + ",0)");
    			toggle_class(g, "highlight", /*highlight*/ ctx[3] && sameDay(/*highlight*/ ctx[3], /*d*/ ctx[16].date));
    			toggle_class(g, "sameMonth", /*highlight*/ ctx[3] && sameMonth(/*highlight*/ ctx[3], /*d*/ ctx[16].date));
    			add_location(g, file$5, 56, 8, 1767);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			if_block0.m(g, null);
    			append_dev(g, circle);
    			if (if_block1) if_block1.m(g, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(g, circle);
    				}
    			}

    			if (dirty & /*highlight, currentTempData*/ 40 && circle_r_value !== (circle_r_value = /*highlight*/ ctx[3] && sameDay(/*highlight*/ ctx[3], /*d*/ ctx[16].date)
    			? 3
    			: 2)) {
    				attr_dev(circle, "r", circle_r_value);
    			}

    			if (dirty & /*yScale, currentTempData*/ 34 && circle_transform_value !== (circle_transform_value = "translate(0," + /*yScale*/ ctx[1](/*d*/ ctx[16].tAvg) + ")")) {
    				attr_dev(circle, "transform", circle_transform_value);
    			}

    			if (dirty & /*$showAnomalies, currentTempData*/ 96) {
    				toggle_class(circle, "hotter", /*$showAnomalies*/ ctx[6] && /*d*/ ctx[16].tAvg > /*d*/ ctx[16].trendMax);
    			}

    			if (dirty & /*$showAnomalies, currentTempData*/ 96) {
    				toggle_class(circle, "colder", /*$showAnomalies*/ ctx[6] && /*d*/ ctx[16].tAvg < /*d*/ ctx[16].trendMin);
    			}

    			if (dirty & /*$showAnomalies, currentTempData*/ 96) {
    				toggle_class(circle, "normal", /*$showAnomalies*/ ctx[6] && /*d*/ ctx[16].tAvg >= /*d*/ ctx[16].trendMin && /*d*/ ctx[16].tAvg <= /*d*/ ctx[16].trendMax);
    			}

    			if (dirty & /*highlight, currentTempData*/ 40) show_if = /*highlight*/ ctx[3] && sameDay(/*highlight*/ ctx[3], /*d*/ ctx[16].date);

    			if (show_if) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(g, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*xScale, currentTempData*/ 33 && g_transform_value !== (g_transform_value = "translate(" + /*xScale*/ ctx[0](/*d*/ ctx[16].date) + ",0)")) {
    				attr_dev(g, "transform", g_transform_value);
    			}

    			if (dirty & /*highlight, sameDay, currentTempData*/ 40) {
    				toggle_class(g, "highlight", /*highlight*/ ctx[3] && sameDay(/*highlight*/ ctx[3], /*d*/ ctx[16].date));
    			}

    			if (dirty & /*highlight, sameMonth, currentTempData*/ 40) {
    				toggle_class(g, "sameMonth", /*highlight*/ ctx[3] && sameMonth(/*highlight*/ ctx[3], /*d*/ ctx[16].date));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(56:4) {#each currentTempData as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let g;
    	let dispose;
    	let each_value = /*currentTempData*/ ctx[5];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "class", "svelte-1tgjoq6");
    			toggle_class(g, "highlight", /*highlight*/ ctx[3]);
    			add_location(g, file$5, 54, 0, 1688);

    			dispose = [
    				listen_dev(window, "mousemove", /*handleMouseMove*/ ctx[7], false, false, false),
    				listen_dev(window, "mouseout", /*mouseout_handler*/ ctx[14], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			/*g_binding*/ ctx[15](g);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*xScale, currentTempData, highlight, sameDay, sameMonth, yScale, fmt, $showAnomalies, Math*/ 123) {
    				each_value = /*currentTempData*/ ctx[5];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*highlight*/ 8) {
    				toggle_class(g, "highlight", /*highlight*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    			/*g_binding*/ ctx[15](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function sameYear(date1, date2) {
    	return date1.getFullYear() === date2.getFullYear();
    }

    function sameMonth(date1, date2) {
    	return sameYear(date1, date2) && date1.getMonth() === date2.getMonth();
    }

    function sameDay(date1, date2) {
    	return sameMonth(date1, date2) && date1.getDate() === date2.getDate();
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $language;
    	let $msg;
    	let $minDate;
    	let $maxDate;
    	let $showAnomalies;
    	validate_store(language, "language");
    	component_subscribe($$self, language, $$value => $$invalidate(10, $language = $$value));
    	validate_store(msg, "msg");
    	component_subscribe($$self, msg, $$value => $$invalidate(11, $msg = $$value));
    	validate_store(minDate, "minDate");
    	component_subscribe($$self, minDate, $$value => $$invalidate(12, $minDate = $$value));
    	validate_store(maxDate, "maxDate");
    	component_subscribe($$self, maxDate, $$value => $$invalidate(13, $maxDate = $$value));
    	validate_store(showAnomalies, "showAnomalies");
    	component_subscribe($$self, showAnomalies, $$value => $$invalidate(6, $showAnomalies = $$value));
    	let { xScale } = $$props;
    	let { yScale } = $$props;
    	let { data } = $$props;
    	let { grouped } = $$props;
    	let layer;
    	let highlight;

    	function handleMouseMove(event) {
    		const [x, y] = clientPoint(layer, event);
    		const date = xScale.invert(x);
    		const temp = yScale.invert(y);

    		$$invalidate(3, highlight = temp >= yScale.domain()[0] && temp <= yScale.domain()[1]
    		? date
    		: null);
    	}

    	const writable_props = ["xScale", "yScale", "data", "grouped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CurrentTemperatures> was created with unknown prop '${key}'`);
    	});

    	const mouseout_handler = () => $$invalidate(3, highlight = null);

    	function g_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, layer = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("xScale" in $$props) $$invalidate(0, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(1, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(8, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(9, grouped = $$props.grouped);
    	};

    	$$self.$capture_state = () => {
    		return {
    			xScale,
    			yScale,
    			data,
    			grouped,
    			layer,
    			highlight,
    			fmt,
    			$language,
    			$msg,
    			currentTempData,
    			$minDate,
    			$maxDate,
    			$showAnomalies
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("xScale" in $$props) $$invalidate(0, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(1, yScale = $$props.yScale);
    		if ("data" in $$props) $$invalidate(8, data = $$props.data);
    		if ("grouped" in $$props) $$invalidate(9, grouped = $$props.grouped);
    		if ("layer" in $$props) $$invalidate(2, layer = $$props.layer);
    		if ("highlight" in $$props) $$invalidate(3, highlight = $$props.highlight);
    		if ("fmt" in $$props) $$invalidate(4, fmt = $$props.fmt);
    		if ("$language" in $$props) language.set($language = $$props.$language);
    		if ("$msg" in $$props) msg.set($msg = $$props.$msg);
    		if ("currentTempData" in $$props) $$invalidate(5, currentTempData = $$props.currentTempData);
    		if ("$minDate" in $$props) minDate.set($minDate = $$props.$minDate);
    		if ("$maxDate" in $$props) maxDate.set($maxDate = $$props.$maxDate);
    		if ("$showAnomalies" in $$props) showAnomalies.set($showAnomalies = $$props.$showAnomalies);
    	};

    	let fmt;
    	let currentTempData;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$language, $msg*/ 3072) {
    			 $$invalidate(4, fmt = date => $language === "de"
    			? `${date.getDate()}. ${$msg.monthShort[date.getMonth()]}`
    			: `${$msg.monthShort[date.getMonth()]} ${date.getDate()}`);
    		}

    		if ($$self.$$.dirty & /*data, $minDate, $maxDate, $showAnomalies, grouped*/ 13120) {
    			 $$invalidate(5, currentTempData = data.filter(d => d.date >= $minDate && d.date <= $maxDate).map(d => {
    				if ($showAnomalies) {
    					const m = grouped.find(e => e.dateRaw === d.dateRaw);

    					if (m) {
    						d.trendMin = m.tMin;
    						d.trendMax = m.tMax;
    					}
    				}

    				return d;
    			}));
    		}
    	};

    	return [
    		xScale,
    		yScale,
    		layer,
    		highlight,
    		fmt,
    		currentTempData,
    		$showAnomalies,
    		handleMouseMove,
    		data,
    		grouped,
    		$language,
    		$msg,
    		$minDate,
    		$maxDate,
    		mouseout_handler,
    		g_binding
    	];
    }

    class CurrentTemperatures extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			xScale: 0,
    			yScale: 1,
    			data: 8,
    			grouped: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CurrentTemperatures",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*xScale*/ ctx[0] === undefined && !("xScale" in props)) {
    			console.warn("<CurrentTemperatures> was created without expected prop 'xScale'");
    		}

    		if (/*yScale*/ ctx[1] === undefined && !("yScale" in props)) {
    			console.warn("<CurrentTemperatures> was created without expected prop 'yScale'");
    		}

    		if (/*data*/ ctx[8] === undefined && !("data" in props)) {
    			console.warn("<CurrentTemperatures> was created without expected prop 'data'");
    		}

    		if (/*grouped*/ ctx[9] === undefined && !("grouped" in props)) {
    			console.warn("<CurrentTemperatures> was created without expected prop 'grouped'");
    		}
    	}

    	get xScale() {
    		throw new Error("<CurrentTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xScale(value) {
    		throw new Error("<CurrentTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yScale() {
    		throw new Error("<CurrentTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yScale(value) {
    		throw new Error("<CurrentTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<CurrentTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<CurrentTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grouped() {
    		throw new Error("<CurrentTemperatures>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grouped(value) {
    		throw new Error("<CurrentTemperatures>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Checkbox.svelte generated by Svelte v3.16.7 */

    const file$6 = "src/components/Checkbox.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let input;
    	let t;
    	let label_1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			label_1 = element("label");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "custom-control-input");
    			attr_dev(input, "id", /*id*/ ctx[2]);
    			add_location(input, file$6, 8, 2, 178);
    			attr_dev(label_1, "class", "custom-control-label");
    			attr_dev(label_1, "for", /*id*/ ctx[2]);
    			add_location(label_1, file$6, 9, 2, 264);
    			attr_dev(div, "class", "custom-control custom-checkbox svelte-2esays");
    			add_location(div, file$6, 7, 0, 131);
    			dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = /*value*/ ctx[0];
    			append_dev(div, t);
    			append_dev(div, label_1);
    			label_1.innerHTML = /*label*/ ctx[1];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				input.checked = /*value*/ ctx[0];
    			}

    			if (dirty & /*label*/ 2) label_1.innerHTML = /*label*/ ctx[1];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { label } = $$props;
    	const id = `checkbox-${Math.round(Math.random() * 1000000).toString(30)}`;
    	const writable_props = ["value", "label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkbox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		value = this.checked;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    	};

    	$$self.$capture_state = () => {
    		return { value, label };
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    	};

    	return [value, label, id, input_change_handler];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { value: 0, label: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Checkbox> was created without expected prop 'value'");
    		}

    		if (/*label*/ ctx[1] === undefined && !("label" in props)) {
    			console.warn("<Checkbox> was created without expected prop 'label'");
    		}
    	}

    	get value() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DataLoaded.svelte generated by Svelte v3.16.7 */

    const file$7 = "src/DataLoaded.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	return child_ctx;
    }

    // (135:16) {#each [5,10,15,20,25,30,35,40,50,60,70,80] as yr}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(/*yr*/ ctx[38]);
    			option.__value = option_value_value = /*yr*/ ctx[38];
    			option.value = option.__value;
    			add_location(option, file$7, 135, 16, 4979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(135:16) {#each [5,10,15,20,25,30,35,40,50,60,70,80] as yr}",
    		ctx
    	});

    	return block;
    }

    // (161:16) {#each [0,1,2,3,4,5,7,15] as dy}
    function create_each_block$2(ctx) {
    	let option;
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(/*dy*/ ctx[35]);
    			option.__value = option_value_value = /*dy*/ ctx[35];
    			option.value = option.__value;
    			add_location(option, file$7, 161, 16, 6178);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(161:16) {#each [0,1,2,3,4,5,7,15] as dy}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let t0;
    	let hr;
    	let t1;
    	let div12;
    	let div5;
    	let div4;
    	let div0;
    	let input0;
    	let input0_value_value;
    	let t2;
    	let small0;
    	let t3_value = /*$msg*/ ctx[8].year + "";
    	let t3;
    	let t4;
    	let div1;
    	let input1;
    	let input1_value_value;
    	let t5;
    	let small1;
    	let t6_value = /*$msg*/ ctx[8].month + "";
    	let t6;
    	let t7;
    	let div2;
    	let input2;
    	let input2_value_value;
    	let t8;
    	let small2;
    	let t9_value = /*$msg*/ ctx[8].day + "";
    	let t9;
    	let t10;
    	let div3;
    	let button;
    	let t11_value = /*$msg*/ ctx[8].today + "";
    	let t11;
    	let t12;
    	let div6;
    	let updating_value;
    	let t13;
    	let p0;
    	let t15;
    	let div11;
    	let div7;
    	let updating_value_1;
    	let t16;
    	let updating_value_2;
    	let t17;
    	let updating_value_3;
    	let t18;
    	let p1;
    	let t19;
    	let b;
    	let t20;
    	let t21;
    	let t22_value = /*$contextMaxYear*/ ctx[11] - 1 + "";
    	let t22;
    	let t23;
    	let t24;
    	let div8;
    	let label0;
    	let t26;
    	let select0;
    	let t27;
    	let label1;
    	let t29;
    	let input3;
    	let input3_max_value;
    	let input3_updating = false;
    	let t30;
    	let div9;
    	let label2;
    	let t32;
    	let select1;
    	let option0;
    	let option0_value_value;
    	let option1;
    	let option1_value_value;
    	let option2;
    	let option2_value_value;
    	let option3;
    	let option3_value_value;
    	let t37;
    	let div10;
    	let label3;
    	let small3;
    	let t39;
    	let select2;
    	let t40;
    	let label4;
    	let small4;
    	let current;
    	let dispose;

    	const basechart = new BaseChart({
    			props: {
    				data: /*data*/ ctx[0],
    				layers: /*layers*/ ctx[4]
    			},
    			$$inline: true
    		});

    	function checkbox0_value_binding(value) {
    		/*checkbox0_value_binding*/ ctx[27].call(null, value);
    	}

    	let checkbox0_props = {
    		label: "Absolute Höchst- und Tiefstwerte"
    	};

    	if (/*layerRecord*/ ctx[1] !== void 0) {
    		checkbox0_props.value = /*layerRecord*/ ctx[1];
    	}

    	const checkbox0 = new Checkbox({ props: checkbox0_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox0, "value", checkbox0_value_binding));

    	function checkbox1_value_binding(value_1) {
    		/*checkbox1_value_binding*/ ctx[28].call(null, value_1);
    	}

    	let checkbox1_props = { label: "Mittlere Höchst und Tiefstwerte" };

    	if (/*layerNormalRange*/ ctx[3] !== void 0) {
    		checkbox1_props.value = /*layerNormalRange*/ ctx[3];
    	}

    	const checkbox1 = new Checkbox({ props: checkbox1_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox1, "value", checkbox1_value_binding));

    	function checkbox2_value_binding(value_2) {
    		/*checkbox2_value_binding*/ ctx[29].call(null, value_2);
    	}

    	let checkbox2_props = { label: "Mittlere Tagesmitteltemperatur" };

    	if (/*layerNormal*/ ctx[2] !== void 0) {
    		checkbox2_props.value = /*layerNormal*/ ctx[2];
    	}

    	const checkbox2 = new Checkbox({ props: checkbox2_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox2, "value", checkbox2_value_binding));

    	function checkbox3_value_binding(value_3) {
    		/*checkbox3_value_binding*/ ctx[30].call(null, value_3);
    	}

    	let checkbox3_props = { label: "Anomalien hervorheben" };

    	if (/*$showAnomalies*/ ctx[9] !== void 0) {
    		checkbox3_props.value = /*$showAnomalies*/ ctx[9];
    	}

    	const checkbox3 = new Checkbox({ props: checkbox3_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox3, "value", checkbox3_value_binding));
    	let each_value_1 = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80];
    	let each_blocks_1 = [];

    	for (let i = 0; i < 12; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	function input3_input_handler() {
    		input3_updating = true;
    		/*input3_input_handler*/ ctx[32].call(input3);
    	}

    	let each_value = [0, 1, 2, 3, 4, 5, 7, 15];
    	let each_blocks = [];

    	for (let i = 0; i < 8; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(basechart.$$.fragment);
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			div12 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			small0 = element("small");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			small1 = element("small");
    			t6 = text(t6_value);
    			t7 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t8 = space();
    			small2 = element("small");
    			t9 = text(t9_value);
    			t10 = space();
    			div3 = element("div");
    			button = element("button");
    			t11 = text(t11_value);
    			t12 = space();
    			div6 = element("div");
    			create_component(checkbox0.$$.fragment);
    			t13 = space();
    			p0 = element("p");
    			p0.textContent = "Bezogen auf gesamten verfügbaren Zeitraum";
    			t15 = space();
    			div11 = element("div");
    			div7 = element("div");
    			create_component(checkbox1.$$.fragment);
    			t16 = space();
    			create_component(checkbox2.$$.fragment);
    			t17 = space();
    			create_component(checkbox3.$$.fragment);
    			t18 = space();
    			p1 = element("p");
    			t19 = text("Gemittelte Werte beziehen sich auf den Vergleichszeitraum ");
    			b = element("b");
    			t20 = text(/*$contextMinYear*/ ctx[10]);
    			t21 = text(" - ");
    			t22 = text(t22_value);
    			t23 = text(". Anomalien bezeichnen Tagestemperaturen ober- und unterhalb der gemittelten Tageshöchst- und Tiefstwerte");
    			t24 = space();
    			div8 = element("div");
    			label0 = element("label");
    			label0.textContent = "Vergleichszeitraum ändern:";
    			t26 = space();
    			select0 = element("select");

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t27 = space();
    			label1 = element("label");
    			label1.textContent = "Jahre ab";
    			t29 = space();
    			input3 = element("input");
    			t30 = space();
    			div9 = element("div");
    			label2 = element("label");
    			label2.textContent = "Normalbereich:";
    			t32 = space();
    			select1 = element("select");
    			option0 = element("option");
    			option0.textContent = "Median (Tiefst- u. Höchstwert)";
    			option1 = element("option");
    			option1.textContent = "35pct. Tiefst - 65pct Höchst";
    			option2 = element("option");
    			option2.textContent = "25pct. Tiefst - 75pct Höchst";
    			option3 = element("option");
    			option3.textContent = "keiner";
    			t37 = space();
    			div10 = element("div");
    			label3 = element("label");
    			small3 = element("small");
    			small3.textContent = "Glättung: ±";
    			t39 = space();
    			select2 = element("select");

    			for (let i = 0; i < 8; i += 1) {
    				each_blocks[i].c();
    			}

    			t40 = space();
    			label4 = element("label");
    			small4 = element("small");
    			small4.textContent = "Tage";
    			add_location(hr, file$7, 95, 0, 2657);
    			attr_dev(input0, "class", "form-control form-control-sm svelte-5kb5qa");
    			attr_dev(input0, "type", "number");
    			input0.value = input0_value_value = /*$maxDate*/ ctx[7].getFullYear();
    			add_location(input0, file$7, 102, 16, 2918);
    			attr_dev(small0, "class", "form-text text-muted svelte-5kb5qa");
    			add_location(small0, file$7, 103, 16, 3026);
    			attr_dev(div0, "class", "col-auto form-group svelte-5kb5qa");
    			add_location(div0, file$7, 100, 12, 2753);
    			attr_dev(input1, "class", "form-control form-control-sm svelte-5kb5qa");
    			attr_dev(input1, "type", "number");
    			input1.value = input1_value_value = /*$maxDate*/ ctx[7].getMonth() + 1;
    			add_location(input1, file$7, 106, 16, 3163);
    			attr_dev(small1, "class", "form-text text-muted svelte-5kb5qa");
    			add_location(small1, file$7, 107, 16, 3270);
    			attr_dev(div1, "class", "col-auto form-group svelte-5kb5qa");
    			add_location(div1, file$7, 105, 12, 3113);
    			attr_dev(input2, "class", "form-control form-control-sm svelte-5kb5qa");
    			attr_dev(input2, "type", "number");
    			input2.value = input2_value_value = /*$maxDate*/ ctx[7].getDate();
    			add_location(input2, file$7, 110, 16, 3408);
    			attr_dev(small2, "class", "form-text text-muted svelte-5kb5qa");
    			add_location(small2, file$7, 111, 16, 3512);
    			attr_dev(div2, "class", "col-auto form-group svelte-5kb5qa");
    			add_location(div2, file$7, 109, 12, 3358);
    			attr_dev(button, "class", "btn btn-sm btn-outline-secondary");
    			add_location(button, file$7, 115, 16, 3751);
    			attr_dev(div3, "class", "col-auto");
    			add_location(div3, file$7, 114, 12, 3712);
    			attr_dev(div4, "class", "form-row");
    			add_location(div4, file$7, 99, 8, 2718);
    			attr_dev(div5, "class", "col-md-3");
    			add_location(div5, file$7, 98, 4, 2687);
    			attr_dev(p0, "class", "text-muted");
    			add_location(p0, file$7, 121, 8, 4034);
    			attr_dev(div6, "class", "col-md-3");
    			add_location(div6, file$7, 119, 4, 3916);
    			attr_dev(div7, "class", "form-inline svelte-5kb5qa");
    			add_location(div7, file$7, 124, 8, 4148);
    			add_location(b, file$7, 129, 88, 4544);
    			attr_dev(p1, "class", "text-muted");
    			add_location(p1, file$7, 129, 8, 4464);
    			attr_dev(label0, "class", "my-1 mr-2");
    			add_location(label0, file$7, 132, 12, 4749);
    			attr_dev(select0, "class", "custom-select custom-select-sm");
    			if (/*$contextRange*/ ctx[12] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[31].call(select0));
    			add_location(select0, file$7, 133, 12, 4821);
    			attr_dev(label1, "class", "my-1 mr-1 ml-1 text-muted");
    			add_location(label1, file$7, 138, 12, 5072);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "form-control form-control-sm svelte-5kb5qa");
    			attr_dev(input3, "min", /*globalMinYear*/ ctx[5]);
    			attr_dev(input3, "max", input3_max_value = /*globalMaxYear*/ ctx[6] - /*$contextRange*/ ctx[12]);
    			add_location(input3, file$7, 139, 12, 5142);
    			attr_dev(div8, "class", "form-inline svelte-5kb5qa");
    			add_location(div8, file$7, 131, 8, 4711);
    			attr_dev(label2, "class", "my-1 mr-2");
    			add_location(label2, file$7, 148, 12, 5450);
    			option0.__value = option0_value_value = 50;
    			option0.value = option0.__value;
    			add_location(option0, file$7, 150, 16, 5600);
    			option1.__value = option1_value_value = 35;
    			option1.value = option1.__value;
    			add_location(option1, file$7, 151, 16, 5677);
    			option2.__value = option2_value_value = 25;
    			option2.value = option2.__value;
    			add_location(option2, file$7, 152, 16, 5752);
    			option3.__value = option3_value_value = 100;
    			option3.value = option3.__value;
    			add_location(option3, file$7, 153, 16, 5827);
    			attr_dev(select1, "class", "custom-select custom-select-sm");
    			if (/*$normalRange*/ ctx[13] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[33].call(select1));
    			add_location(select1, file$7, 149, 12, 5510);
    			attr_dev(div9, "class", "form-inline svelte-5kb5qa");
    			add_location(div9, file$7, 147, 8, 5412);
    			add_location(small3, file$7, 158, 37, 5974);
    			attr_dev(label3, "class", "my-1 mr-2");
    			add_location(label3, file$7, 158, 12, 5949);
    			attr_dev(select2, "class", "custom-select custom-select-sm");
    			if (/*$smoothNormalRangeWidth*/ ctx[14] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[34].call(select2));
    			add_location(select2, file$7, 159, 12, 6028);
    			add_location(small4, file$7, 164, 53, 6312);
    			attr_dev(label4, "class", "my-1 mr-1 ml-1 text-muted");
    			add_location(label4, file$7, 164, 12, 6271);
    			attr_dev(div10, "class", "form-inline svelte-5kb5qa");
    			add_location(div10, file$7, 157, 8, 5911);
    			attr_dev(div11, "class", "col-md-6");
    			add_location(div11, file$7, 123, 4, 4117);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$7, 97, 0, 2665);

    			dispose = [
    				listen_dev(window, "mouseup", /*stop*/ ctx[15], false, false, false),
    				listen_dev(button, "mousedown", /*mousedown_handler*/ ctx[26], false, false, false),
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[31]),
    				listen_dev(input3, "input", input3_input_handler),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[33]),
    				listen_dev(select2, "change", /*select2_change_handler*/ ctx[34])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(basechart, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, input0);
    			append_dev(div0, t2);
    			append_dev(div0, small0);
    			append_dev(small0, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div1);
    			append_dev(div1, input1);
    			append_dev(div1, t5);
    			append_dev(div1, small1);
    			append_dev(small1, t6);
    			append_dev(div4, t7);
    			append_dev(div4, div2);
    			append_dev(div2, input2);
    			append_dev(div2, t8);
    			append_dev(div2, small2);
    			append_dev(small2, t9);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, t11);
    			append_dev(div12, t12);
    			append_dev(div12, div6);
    			mount_component(checkbox0, div6, null);
    			append_dev(div6, t13);
    			append_dev(div6, p0);
    			append_dev(div12, t15);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			mount_component(checkbox1, div7, null);
    			append_dev(div7, t16);
    			mount_component(checkbox2, div7, null);
    			append_dev(div7, t17);
    			mount_component(checkbox3, div7, null);
    			append_dev(div11, t18);
    			append_dev(div11, p1);
    			append_dev(p1, t19);
    			append_dev(p1, b);
    			append_dev(b, t20);
    			append_dev(b, t21);
    			append_dev(b, t22);
    			append_dev(p1, t23);
    			append_dev(div11, t24);
    			append_dev(div11, div8);
    			append_dev(div8, label0);
    			append_dev(div8, t26);
    			append_dev(div8, select0);

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*$contextRange*/ ctx[12]);
    			append_dev(div8, t27);
    			append_dev(div8, label1);
    			append_dev(div8, t29);
    			append_dev(div8, input3);
    			set_input_value(input3, /*$contextMinYear*/ ctx[10]);
    			append_dev(div11, t30);
    			append_dev(div11, div9);
    			append_dev(div9, label2);
    			append_dev(div9, t32);
    			append_dev(div9, select1);
    			append_dev(select1, option0);
    			append_dev(select1, option1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			select_option(select1, /*$normalRange*/ ctx[13]);
    			append_dev(div11, t37);
    			append_dev(div11, div10);
    			append_dev(div10, label3);
    			append_dev(label3, small3);
    			append_dev(div10, t39);
    			append_dev(div10, select2);

    			for (let i = 0; i < 8; i += 1) {
    				each_blocks[i].m(select2, null);
    			}

    			select_option(select2, /*$smoothNormalRangeWidth*/ ctx[14]);
    			append_dev(div10, t40);
    			append_dev(div10, label4);
    			append_dev(label4, small4);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const basechart_changes = {};
    			if (dirty[0] & /*data*/ 1) basechart_changes.data = /*data*/ ctx[0];
    			if (dirty[0] & /*layers*/ 16) basechart_changes.layers = /*layers*/ ctx[4];
    			basechart.$set(basechart_changes);

    			if (!current || dirty[0] & /*$maxDate*/ 128 && input0_value_value !== (input0_value_value = /*$maxDate*/ ctx[7].getFullYear())) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if ((!current || dirty[0] & /*$msg*/ 256) && t3_value !== (t3_value = /*$msg*/ ctx[8].year + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty[0] & /*$maxDate*/ 128 && input1_value_value !== (input1_value_value = /*$maxDate*/ ctx[7].getMonth() + 1)) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if ((!current || dirty[0] & /*$msg*/ 256) && t6_value !== (t6_value = /*$msg*/ ctx[8].month + "")) set_data_dev(t6, t6_value);

    			if (!current || dirty[0] & /*$maxDate*/ 128 && input2_value_value !== (input2_value_value = /*$maxDate*/ ctx[7].getDate())) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if ((!current || dirty[0] & /*$msg*/ 256) && t9_value !== (t9_value = /*$msg*/ ctx[8].day + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty[0] & /*$msg*/ 256) && t11_value !== (t11_value = /*$msg*/ ctx[8].today + "")) set_data_dev(t11, t11_value);
    			const checkbox0_changes = {};

    			if (!updating_value && dirty[0] & /*layerRecord*/ 2) {
    				updating_value = true;
    				checkbox0_changes.value = /*layerRecord*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};

    			if (!updating_value_1 && dirty[0] & /*layerNormalRange*/ 8) {
    				updating_value_1 = true;
    				checkbox1_changes.value = /*layerNormalRange*/ ctx[3];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};

    			if (!updating_value_2 && dirty[0] & /*layerNormal*/ 4) {
    				updating_value_2 = true;
    				checkbox2_changes.value = /*layerNormal*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);
    			const checkbox3_changes = {};

    			if (!updating_value_3 && dirty[0] & /*$showAnomalies*/ 512) {
    				updating_value_3 = true;
    				checkbox3_changes.value = /*$showAnomalies*/ ctx[9];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			checkbox3.$set(checkbox3_changes);
    			if (!current || dirty[0] & /*$contextMinYear*/ 1024) set_data_dev(t20, /*$contextMinYear*/ ctx[10]);
    			if ((!current || dirty[0] & /*$contextMaxYear*/ 2048) && t22_value !== (t22_value = /*$contextMaxYear*/ ctx[11] - 1 + "")) set_data_dev(t22, t22_value);

    			if (dirty[0] & /*$contextRange*/ 4096) {
    				select_option(select0, /*$contextRange*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*globalMinYear*/ 32) {
    				attr_dev(input3, "min", /*globalMinYear*/ ctx[5]);
    			}

    			if (!current || dirty[0] & /*globalMaxYear, $contextRange*/ 4160 && input3_max_value !== (input3_max_value = /*globalMaxYear*/ ctx[6] - /*$contextRange*/ ctx[12])) {
    				attr_dev(input3, "max", input3_max_value);
    			}

    			if (!input3_updating && dirty[0] & /*$contextMinYear*/ 1024) {
    				set_input_value(input3, /*$contextMinYear*/ ctx[10]);
    			}

    			input3_updating = false;

    			if (dirty[0] & /*$normalRange*/ 8192) {
    				select_option(select1, /*$normalRange*/ ctx[13]);
    			}

    			if (dirty[0] & /*$smoothNormalRangeWidth*/ 16384) {
    				select_option(select2, /*$smoothNormalRangeWidth*/ ctx[14]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(basechart.$$.fragment, local);
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(checkbox3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(basechart.$$.fragment, local);
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(checkbox3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(basechart, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div12);
    			destroy_component(checkbox0);
    			destroy_component(checkbox1);
    			destroy_component(checkbox2);
    			destroy_component(checkbox3);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $maxDate;
    	let $language;
    	let $msg;
    	let $showAnomalies;
    	let $contextMinYear;
    	let $contextMaxYear;
    	let $contextRange;
    	let $normalRange;
    	let $smoothNormalRangeWidth;
    	validate_store(maxDate, "maxDate");
    	component_subscribe($$self, maxDate, $$value => $$invalidate(7, $maxDate = $$value));
    	validate_store(language, "language");
    	component_subscribe($$self, language, $$value => $$invalidate(17, $language = $$value));
    	validate_store(msg, "msg");
    	component_subscribe($$self, msg, $$value => $$invalidate(8, $msg = $$value));
    	validate_store(showAnomalies, "showAnomalies");
    	component_subscribe($$self, showAnomalies, $$value => $$invalidate(9, $showAnomalies = $$value));
    	validate_store(contextMinYear, "contextMinYear");
    	component_subscribe($$self, contextMinYear, $$value => $$invalidate(10, $contextMinYear = $$value));
    	validate_store(contextMaxYear, "contextMaxYear");
    	component_subscribe($$self, contextMaxYear, $$value => $$invalidate(11, $contextMaxYear = $$value));
    	validate_store(contextRange, "contextRange");
    	component_subscribe($$self, contextRange, $$value => $$invalidate(12, $contextRange = $$value));
    	validate_store(normalRange, "normalRange");
    	component_subscribe($$self, normalRange, $$value => $$invalidate(13, $normalRange = $$value));
    	validate_store(smoothNormalRangeWidth, "smoothNormalRangeWidth");
    	component_subscribe($$self, smoothNormalRangeWidth, $$value => $$invalidate(14, $smoothNormalRangeWidth = $$value));
    	let { data } = $$props;
    	let repeat;

    	function changeDate(prop, offset, delay = 300) {
    		let d = new Date($maxDate);
    		d[`set${prop}`](d[`get${prop}`]() + offset);
    		if (d >= new Date()) d = new Date();
    		set_store_value(maxDate, $maxDate = d);
    		stop();
    		repeat = setTimeout(() => changeDate(prop, offset, 0), delay);
    	}

    	const prevDay = () => changeDate("Date", -1);
    	const nextDay = () => changeDate("Date", +1);
    	const prevMonth = () => changeDate("Month", -1);
    	const nextMonth = () => changeDate("Month", +1);
    	const prevYear = () => changeDate("FullYear", -1);
    	const nextYear = () => changeDate("FullYear", +1);

    	function stop() {
    		clearInterval(repeat);
    	}

    	function switchLanguage() {
    		set_store_value(language, $language = $language === "de" ? "en" : "de");
    	}

    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DataLoaded> was created with unknown prop '${key}'`);
    	});

    	const mousedown_handler = () => set_store_value(maxDate, $maxDate = new Date());

    	function checkbox0_value_binding(value) {
    		layerRecord = value;
    		$$invalidate(1, layerRecord);
    	}

    	function checkbox1_value_binding(value_1) {
    		layerNormalRange = value_1;
    		$$invalidate(3, layerNormalRange);
    	}

    	function checkbox2_value_binding(value_2) {
    		layerNormal = value_2;
    		$$invalidate(2, layerNormal);
    	}

    	function checkbox3_value_binding(value_3) {
    		$showAnomalies = value_3;
    		showAnomalies.set($showAnomalies);
    	}

    	function select0_change_handler() {
    		$contextRange = select_value(this);
    		contextRange.set($contextRange);
    	}

    	function input3_input_handler() {
    		$contextMinYear = to_number(this.value);
    		contextMinYear.set($contextMinYear);
    	}

    	function select1_change_handler() {
    		$normalRange = select_value(this);
    		normalRange.set($normalRange);
    	}

    	function select2_change_handler() {
    		$smoothNormalRangeWidth = select_value(this);
    		smoothNormalRangeWidth.set($smoothNormalRangeWidth);
    	}

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return {
    			data,
    			repeat,
    			layerRecord,
    			layerNormal,
    			layerNormalRange,
    			layers,
    			globalMinYear,
    			globalMaxYear,
    			$maxDate,
    			$language,
    			$msg,
    			$showAnomalies,
    			$contextMinYear,
    			$contextMaxYear,
    			$contextRange,
    			$normalRange,
    			$smoothNormalRangeWidth
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("repeat" in $$props) repeat = $$props.repeat;
    		if ("layerRecord" in $$props) $$invalidate(1, layerRecord = $$props.layerRecord);
    		if ("layerNormal" in $$props) $$invalidate(2, layerNormal = $$props.layerNormal);
    		if ("layerNormalRange" in $$props) $$invalidate(3, layerNormalRange = $$props.layerNormalRange);
    		if ("layers" in $$props) $$invalidate(4, layers = $$props.layers);
    		if ("globalMinYear" in $$props) $$invalidate(5, globalMinYear = $$props.globalMinYear);
    		if ("globalMaxYear" in $$props) $$invalidate(6, globalMaxYear = $$props.globalMaxYear);
    		if ("$maxDate" in $$props) maxDate.set($maxDate = $$props.$maxDate);
    		if ("$language" in $$props) language.set($language = $$props.$language);
    		if ("$msg" in $$props) msg.set($msg = $$props.$msg);
    		if ("$showAnomalies" in $$props) showAnomalies.set($showAnomalies = $$props.$showAnomalies);
    		if ("$contextMinYear" in $$props) contextMinYear.set($contextMinYear = $$props.$contextMinYear);
    		if ("$contextMaxYear" in $$props) contextMaxYear.set($contextMaxYear = $$props.$contextMaxYear);
    		if ("$contextRange" in $$props) contextRange.set($contextRange = $$props.$contextRange);
    		if ("$normalRange" in $$props) normalRange.set($normalRange = $$props.$normalRange);
    		if ("$smoothNormalRangeWidth" in $$props) smoothNormalRangeWidth.set($smoothNormalRangeWidth = $$props.$smoothNormalRangeWidth);
    	};

    	let layerRecord;
    	let layerNormal;
    	let layerNormalRange;
    	let layers;
    	let globalMinYear;
    	let globalMaxYear;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*layerRecord, layerNormalRange, layerNormal*/ 14) {
    			 $$invalidate(4, layers = [
    				...layerRecord ? [RecordTemperatures] : [],
    				...layerNormalRange ? [NormalTemperatureRange] : [],
    				CurrentTemperatures,
    				...layerNormal ? [NormalTemperature] : []
    			]);
    		}

    		if ($$self.$$.dirty[0] & /*data*/ 1) {
    			 $$invalidate(5, globalMinYear = data[data.length - 1].date.getFullYear());
    		}

    		if ($$self.$$.dirty[0] & /*data*/ 1) {
    			 $$invalidate(6, globalMaxYear = data[0].date.getFullYear());
    		}
    	};

    	 $$invalidate(1, layerRecord = true);
    	 $$invalidate(2, layerNormal = true);
    	 $$invalidate(3, layerNormalRange = true);

    	return [
    		data,
    		layerRecord,
    		layerNormal,
    		layerNormalRange,
    		layers,
    		globalMinYear,
    		globalMaxYear,
    		$maxDate,
    		$msg,
    		$showAnomalies,
    		$contextMinYear,
    		$contextMaxYear,
    		$contextRange,
    		$normalRange,
    		$smoothNormalRangeWidth,
    		stop,
    		repeat,
    		$language,
    		changeDate,
    		prevDay,
    		nextDay,
    		prevMonth,
    		nextMonth,
    		prevYear,
    		nextYear,
    		switchLanguage,
    		mousedown_handler,
    		checkbox0_value_binding,
    		checkbox1_value_binding,
    		checkbox2_value_binding,
    		checkbox3_value_binding,
    		select0_change_handler,
    		input3_input_handler,
    		select1_change_handler,
    		select2_change_handler
    	];
    }

    class DataLoaded extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { data: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataLoaded",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<DataLoaded> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<DataLoaded>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<DataLoaded>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/partials/LanguageSelect.svelte generated by Svelte v3.16.7 */
    const file$8 = "src/partials/LanguageSelect.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (6:4) {#each options as opt}
    function create_each_block$3(ctx) {
    	let label;
    	let input;
    	let input_value_value;
    	let t0;
    	let t1_value = /*opt*/ ctx[4].toUpperCase() + "";
    	let t1;
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			input.__value = input_value_value = /*opt*/ ctx[4];
    			input.value = input.__value;
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "name", "options");
    			/*$$binding_groups*/ ctx[3][0].push(input);
    			add_location(input, file$8, 7, 8, 266);
    			attr_dev(label, "class", "btn btn-outline-secondary");
    			toggle_class(label, "active", /*$language*/ ctx[0] === /*opt*/ ctx[4]);
    			add_location(label, file$8, 6, 4, 183);
    			dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = input.__value === /*$language*/ ctx[0];
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$language*/ 1) {
    				input.checked = input.__value === /*$language*/ ctx[0];
    			}

    			if (dirty & /*$language, options*/ 3) {
    				toggle_class(label, "active", /*$language*/ ctx[0] === /*opt*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[3][0].splice(/*$$binding_groups*/ ctx[3][0].indexOf(input), 1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(6:4) {#each options as opt}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let each_value = /*options*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "btn-group btn-group-toggle");
    			attr_dev(div, "data-toggle", "buttons");
    			add_location(div, file$8, 4, 0, 89);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$language, options*/ 3) {
    				each_value = /*options*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $language;
    	validate_store(language, "language");
    	component_subscribe($$self, language, $$value => $$invalidate(0, $language = $$value));
    	const options = ["de", "en"];
    	const $$binding_groups = [[]];

    	function input_change_handler() {
    		$language = this.__value;
    		language.set($language);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$language" in $$props) language.set($language = $$props.$language);
    	};

    	return [$language, options, input_change_handler, $$binding_groups];
    }

    class LanguageSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LanguageSelect",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/partials/StationInfo.svelte generated by Svelte v3.16.7 */
    const file$9 = "src/partials/StationInfo.svelte";

    // (6:0) {#if station}
    function create_if_block$2(ctx) {
    	let h2;
    	let t0_value = /*station*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*station*/ ctx[0].state + "";
    	let t2;
    	let t3;
    	let div5;
    	let div4;
    	let div0;
    	let b0;
    	let t5;
    	let tt;
    	let t6_value = /*station*/ ctx[0].id + "";
    	let t6;
    	let t7;
    	let div1;
    	let b1;
    	let t8_value = /*$msg*/ ctx[1].timerange + "";
    	let t8;
    	let t9;
    	let t10;
    	let t11_value = /*$msg*/ ctx[1].monthLong[/*station*/ ctx[0].from.getMonth()] + "";
    	let t11;
    	let t12;
    	let t13_value = /*station*/ ctx[0].from.getFullYear() + "";
    	let t13;
    	let t14;
    	let t15_value = /*$msg*/ ctx[1].to + "";
    	let t15;
    	let t16;
    	let t17_value = /*$msg*/ ctx[1].monthLong[/*station*/ ctx[0].to.getMonth()] + "";
    	let t17;
    	let t18;
    	let t19_value = /*station*/ ctx[0].to.getFullYear() + "";
    	let t19;
    	let t20;
    	let div2;
    	let b2;
    	let t22;
    	let a;
    	let t23_value = /*station*/ ctx[0].lat + "";
    	let t23;
    	let t24;
    	let t25_value = /*station*/ ctx[0].lon + "";
    	let t25;
    	let a_href_value;
    	let t26;
    	let div3;
    	let b3;
    	let t27_value = /*$msg*/ ctx[1].altitude + "";
    	let t27;
    	let t28;
    	let t29;
    	let t30_value = /*station*/ ctx[0].altitude + "";
    	let t30;
    	let t31;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(", ");
    			t2 = text(t2_value);
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			b0 = element("b");
    			b0.textContent = "ID:";
    			t5 = space();
    			tt = element("tt");
    			t6 = text(t6_value);
    			t7 = space();
    			div1 = element("div");
    			b1 = element("b");
    			t8 = text(t8_value);
    			t9 = text(":");
    			t10 = space();
    			t11 = text(t11_value);
    			t12 = space();
    			t13 = text(t13_value);
    			t14 = space();
    			t15 = text(t15_value);
    			t16 = space();
    			t17 = text(t17_value);
    			t18 = space();
    			t19 = text(t19_value);
    			t20 = space();
    			div2 = element("div");
    			b2 = element("b");
    			b2.textContent = "Lat/Lon:";
    			t22 = space();
    			a = element("a");
    			t23 = text(t23_value);
    			t24 = text(", ");
    			t25 = text(t25_value);
    			t26 = space();
    			div3 = element("div");
    			b3 = element("b");
    			t27 = text(t27_value);
    			t28 = text(":");
    			t29 = space();
    			t30 = text(t30_value);
    			t31 = text("m");
    			add_location(h2, file$9, 6, 0, 95);
    			add_location(b0, file$9, 11, 12, 224);
    			add_location(tt, file$9, 11, 23, 235);
    			attr_dev(div0, "class", "col-sm-auto");
    			add_location(div0, file$9, 10, 8, 186);
    			add_location(b1, file$9, 13, 12, 309);
    			attr_dev(div1, "class", "col-sm-auto");
    			add_location(div1, file$9, 12, 14, 271);
    			add_location(b2, file$9, 16, 12, 543);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", a_href_value = "https://www.openstreetmap.org/#map=19/" + /*station*/ ctx[0].lat + "/" + /*station*/ ctx[0].lon);
    			add_location(a, file$9, 16, 28, 559);
    			attr_dev(div2, "class", "col-sm-auto");
    			add_location(div2, file$9, 15, 8, 505);
    			add_location(b3, file$9, 19, 12, 745);
    			attr_dev(div3, "class", "col-sm-auto");
    			add_location(div3, file$9, 18, 8, 707);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$9, 9, 4, 160);
    			attr_dev(div5, "class", "info");
    			add_location(div5, file$9, 7, 0, 136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, b0);
    			append_dev(div0, t5);
    			append_dev(div0, tt);
    			append_dev(tt, t6);
    			append_dev(div0, t7);
    			append_dev(div4, div1);
    			append_dev(div1, b1);
    			append_dev(b1, t8);
    			append_dev(b1, t9);
    			append_dev(div1, t10);
    			append_dev(div1, t11);
    			append_dev(div1, t12);
    			append_dev(div1, t13);
    			append_dev(div1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, t16);
    			append_dev(div1, t17);
    			append_dev(div1, t18);
    			append_dev(div1, t19);
    			append_dev(div4, t20);
    			append_dev(div4, div2);
    			append_dev(div2, b2);
    			append_dev(div2, t22);
    			append_dev(div2, a);
    			append_dev(a, t23);
    			append_dev(a, t24);
    			append_dev(a, t25);
    			append_dev(div4, t26);
    			append_dev(div4, div3);
    			append_dev(div3, b3);
    			append_dev(b3, t27);
    			append_dev(b3, t28);
    			append_dev(div3, t29);
    			append_dev(div3, t30);
    			append_dev(div3, t31);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*station*/ 1 && t0_value !== (t0_value = /*station*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*station*/ 1 && t2_value !== (t2_value = /*station*/ ctx[0].state + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*station*/ 1 && t6_value !== (t6_value = /*station*/ ctx[0].id + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*$msg*/ 2 && t8_value !== (t8_value = /*$msg*/ ctx[1].timerange + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*$msg, station*/ 3 && t11_value !== (t11_value = /*$msg*/ ctx[1].monthLong[/*station*/ ctx[0].from.getMonth()] + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*station*/ 1 && t13_value !== (t13_value = /*station*/ ctx[0].from.getFullYear() + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*$msg*/ 2 && t15_value !== (t15_value = /*$msg*/ ctx[1].to + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*$msg, station*/ 3 && t17_value !== (t17_value = /*$msg*/ ctx[1].monthLong[/*station*/ ctx[0].to.getMonth()] + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*station*/ 1 && t19_value !== (t19_value = /*station*/ ctx[0].to.getFullYear() + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*station*/ 1 && t23_value !== (t23_value = /*station*/ ctx[0].lat + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*station*/ 1 && t25_value !== (t25_value = /*station*/ ctx[0].lon + "")) set_data_dev(t25, t25_value);

    			if (dirty & /*station*/ 1 && a_href_value !== (a_href_value = "https://www.openstreetmap.org/#map=19/" + /*station*/ ctx[0].lat + "/" + /*station*/ ctx[0].lon)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$msg*/ 2 && t27_value !== (t27_value = /*$msg*/ ctx[1].altitude + "")) set_data_dev(t27, t27_value);
    			if (dirty & /*station*/ 1 && t30_value !== (t30_value = /*station*/ ctx[0].altitude + "")) set_data_dev(t30, t30_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(6:0) {#if station}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*station*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*station*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $msg;
    	validate_store(msg, "msg");
    	component_subscribe($$self, msg, $$value => $$invalidate(1, $msg = $$value));
    	let { station } = $$props;
    	const writable_props = ["station"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StationInfo> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("station" in $$props) $$invalidate(0, station = $$props.station);
    	};

    	$$self.$capture_state = () => {
    		return { station, $msg };
    	};

    	$$self.$inject_state = $$props => {
    		if ("station" in $$props) $$invalidate(0, station = $$props.station);
    		if ("$msg" in $$props) msg.set($msg = $$props.$msg);
    	};

    	return [station, $msg];
    }

    class StationInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { station: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StationInfo",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*station*/ ctx[0] === undefined && !("station" in props)) {
    			console.warn("<StationInfo> was created without expected prop 'station'");
    		}
    	}

    	get station() {
    		throw new Error("<StationInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set station(value) {
    		throw new Error("<StationInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */

    const { window: window_1 } = globals;
    const file$a = "src/App.svelte";

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (105:16) {:catch error}
    function create_catch_block_1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[16].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Something went wrong: ");
    			t1 = text(t1_value);
    			add_location(p, file$a, 106, 20, 3443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(105:16) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (93:46)                      <select class="custom-select" bind:value={station}
    function create_then_block_1(ctx) {
    	let select;
    	let option;
    	let option_value_value;
    	let t1;
    	let small;
    	let t2_value = /*$msg*/ ctx[3].selectStation + "";
    	let t2;
    	let dispose;
    	let each_value = /*groupedStations*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "(select station)";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			small = element("small");
    			t2 = text(t2_value);
    			option.__value = option_value_value = null;
    			option.value = option.__value;
    			add_location(option, file$a, 94, 24, 2789);
    			attr_dev(select, "class", "custom-select svelte-7v5xnf");
    			if (/*station*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[14].call(select));
    			add_location(select, file$a, 93, 20, 2713);
    			attr_dev(small, "class", "form-text text-muted");
    			add_location(small, file$a, 103, 20, 3277);
    			dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[14]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*station*/ ctx[0]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, small, anchor);
    			append_dev(small, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*groupedStations*/ 4) {
    				each_value = /*groupedStations*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*station*/ 1) {
    				select_option(select, /*station*/ ctx[0]);
    			}

    			if (dirty & /*$msg*/ 8 && t2_value !== (t2_value = /*$msg*/ ctx[3].selectStation + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(small);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(93:46)                      <select class=\\\"custom-select\\\" bind:value={station}",
    		ctx
    	});

    	return block;
    }

    // (98:28) {#each stations as s}
    function create_each_block_1$2(ctx) {
    	let option;
    	let t0_value = /*s*/ ctx[20].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*s*/ ctx[20].from.getFullYear() + "";
    	let t2;
    	let t3;
    	let t4_value = /*s*/ ctx[20].to.getFullYear() + "";
    	let t4;
    	let t5;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(" - ");
    			t4 = text(t4_value);
    			t5 = text(")");
    			option.__value = option_value_value = /*s*/ ctx[20];
    			option.value = option.__value;
    			add_location(option, file$a, 98, 28, 3037);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, t2);
    			append_dev(option, t3);
    			append_dev(option, t4);
    			append_dev(option, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*groupedStations*/ 4 && t0_value !== (t0_value = /*s*/ ctx[20].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*groupedStations*/ 4 && t2_value !== (t2_value = /*s*/ ctx[20].from.getFullYear() + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*groupedStations*/ 4 && t4_value !== (t4_value = /*s*/ ctx[20].to.getFullYear() + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*groupedStations*/ 4 && option_value_value !== (option_value_value = /*s*/ ctx[20])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(98:28) {#each stations as s}",
    		ctx
    	});

    	return block;
    }

    // (96:24) {#each groupedStations as stations}
    function create_each_block$4(ctx) {
    	let optgroup;
    	let optgroup_label_value;
    	let each_value_1 = /*stations*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			optgroup = element("optgroup");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(optgroup, "label", optgroup_label_value = /*stations*/ ctx[4][0].state);
    			add_location(optgroup, file$a, 96, 24, 2920);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, optgroup, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(optgroup, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*groupedStations*/ 4) {
    				each_value_1 = /*stations*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(optgroup, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*groupedStations*/ 4 && optgroup_label_value !== (optgroup_label_value = /*stations*/ ctx[4][0].state)) {
    				attr_dev(optgroup, "label", optgroup_label_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(optgroup);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(96:24) {#each groupedStations as stations}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     export let name;     import { csv }
    function create_pending_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(1:0) <script>     export let name;     import { csv }",
    		ctx
    	});

    	return block;
    }

    // (118:4) {#if promise}
    function create_if_block$3(ctx) {
    	let await_block_anchor;
    	let promise_1;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 15,
    		error: 16,
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*promise*/ 2 && promise_1 !== (promise_1 = /*promise*/ ctx[1]) && handle_promise(promise_1, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[15] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(118:4) {#if promise}",
    		ctx
    	});

    	return block;
    }

    // (124:8) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[16].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Something went wrong: ");
    			t1 = text(t1_value);
    			add_location(p, file$a, 125, 12, 3960);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise*/ 2 && t1_value !== (t1_value = /*error*/ ctx[16].message + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(124:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (122:8) {:then data}
    function create_then_block(ctx) {
    	let current;

    	const dataloaded = new DataLoaded({
    			props: { data: /*data*/ ctx[15] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dataloaded.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dataloaded, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dataloaded_changes = {};
    			if (dirty & /*promise*/ 2) dataloaded_changes.data = /*data*/ ctx[15];
    			dataloaded.$set(dataloaded_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dataloaded.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dataloaded.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dataloaded, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(122:8) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (119:24)              <!-- promise is pending -->             <p>Daten werden geladen...</p>         {:then data}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Daten werden geladen...";
    			add_location(p, file$a, 120, 12, 3797);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(119:24)              <!-- promise is pending -->             <p>Daten werden geladen...</p>         {:then data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let header;
    	let div5;
    	let div0;
    	let t0;
    	let div4;
    	let div3;
    	let div1;
    	let promise_1;
    	let t1;
    	let div2;
    	let t2;
    	let main;
    	let current;
    	let dispose;

    	const stationinfo = new StationInfo({
    			props: { station: /*station*/ ctx[0] },
    			$$inline: true
    		});

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 17,
    		error: 16
    	};

    	handle_promise(promise_1 = /*loadStations*/ ctx[5], info);
    	const languageselect = new LanguageSelect({ $$inline: true });
    	let if_block = /*promise*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div5 = element("div");
    			div0 = element("div");
    			create_component(stationinfo.$$.fragment);
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			info.block.c();
    			t1 = space();
    			div2 = element("div");
    			create_component(languageselect.$$.fragment);
    			t2 = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "col-sm");
    			add_location(div0, file$a, 86, 8, 2469);
    			attr_dev(div1, "class", "col-lg");
    			add_location(div1, file$a, 91, 16, 2625);
    			attr_dev(div2, "class", "col-lg-auto");
    			add_location(div2, file$a, 109, 16, 3552);
    			attr_dev(div3, "class", "form-row");
    			add_location(div3, file$a, 90, 12, 2586);
    			attr_dev(div4, "class", "col-sm-4");
    			add_location(div4, file$a, 89, 8, 2551);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$a, 85, 4, 2443);
    			attr_dev(header, "class", "container-fluid");
    			add_location(header, file$a, 84, 0, 2406);
    			attr_dev(main, "class", "svelte-7v5xnf");
    			add_location(main, file$a, 116, 0, 3695);
    			dispose = listen_dev(window_1, "hashchange", /*hashChange*/ ctx[6], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div5);
    			append_dev(div5, div0);
    			mount_component(stationinfo, div0, null);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = null;
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(languageselect, div2, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const stationinfo_changes = {};
    			if (dirty & /*station*/ 1) stationinfo_changes.station = /*station*/ ctx[0];
    			stationinfo.$set(stationinfo_changes);

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[17] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*promise*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stationinfo.$$.fragment, local);
    			transition_in(languageselect.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stationinfo.$$.fragment, local);
    			transition_out(languageselect.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(stationinfo);
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(languageselect);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $maxDate;
    	let $msg;
    	validate_store(maxDate, "maxDate");
    	component_subscribe($$self, maxDate, $$value => $$invalidate(9, $maxDate = $$value));
    	validate_store(msg, "msg");
    	component_subscribe($$self, msg, $$value => $$invalidate(3, $msg = $$value));
    	let { name } = $$props;
    	const tfmt = timeFormat("%Y/%m/%d");

    	const parseRow = d => ({
    		date: new Date(d.date),
    		dateRaw: d.date,
    		tMin: +d.TNK,
    		tAvg: +d.TMK,
    		tMax: +d.TXK
    	});

    	const parseStations = d => ({
    		...d,
    		from: new Date(d.from),
    		to: new Date(d.to),
    		altitude: +d.altitude
    	});

    	let _station;
    	let station;
    	let stations = [];
    	let promise;

    	let loadStations = csv$1("/data/stations.csv", parseStations).then(async res => {
    		$$invalidate(4, stations = res.filter(d => d.from.getFullYear() <= 1980 && d.to.getFullYear() >= 2019).sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
    		await tick();
    		hashChange();
    	});

    	const load = () => {
    		if (!station) return;
    		$$invalidate(1, promise = csv$1(`/data/stations/${station.id}.csv`, parseRow));
    	};

    	beforeUpdate(() => {
    		if (station !== _station) {
    			_station = station;
    			load();
    		}
    	});

    	function hashChange() {
    		const match = window.location.hash.match(/^#\/(\d{5})\/[^\/]+(?:\/(\d{4}\/\d{2}\/\d{2}))?/);

    		if (match) {
    			if (!station || match[1] !== station.id) {
    				$$invalidate(0, station = stations.find(d => d.id === match[1]));
    			}

    			if (match[2]) {
    				set_store_value(maxDate, $maxDate = new Date(match[2]));
    			}
    		}
    	}

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		station = select_value(this);
    		$$invalidate(0, station);
    		($$invalidate(2, groupedStations), $$invalidate(4, stations));
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(7, name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return {
    			name,
    			_station,
    			station,
    			stations,
    			promise,
    			loadStations,
    			groupedStations,
    			$maxDate,
    			$msg
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(7, name = $$props.name);
    		if ("_station" in $$props) _station = $$props._station;
    		if ("station" in $$props) $$invalidate(0, station = $$props.station);
    		if ("stations" in $$props) $$invalidate(4, stations = $$props.stations);
    		if ("promise" in $$props) $$invalidate(1, promise = $$props.promise);
    		if ("loadStations" in $$props) $$invalidate(5, loadStations = $$props.loadStations);
    		if ("groupedStations" in $$props) $$invalidate(2, groupedStations = $$props.groupedStations);
    		if ("$maxDate" in $$props) maxDate.set($maxDate = $$props.$maxDate);
    		if ("$msg" in $$props) msg.set($msg = $$props.$msg);
    	};

    	let groupedStations;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*stations*/ 16) {
    			 $$invalidate(2, groupedStations = Array.from(group(stations, d => d.state)).map(([k, v]) => v).sort((a, b) => a[0].state > b[0].state
    			? 1
    			: a[0].state < b[0].state ? -1 : 0));
    		}

    		if ($$self.$$.dirty & /*station, $maxDate*/ 513) {
    			 {
    				if (station && station.name) {
    					window.location.hash = `#/${station.id}/${station.name.toLowerCase().split("(")[0].trim().replace(/[^a-z-]/g, "")}/${tfmt($maxDate)}`;
    				}
    			}
    		}
    	};

    	return [
    		station,
    		promise,
    		groupedStations,
    		$msg,
    		stations,
    		loadStations,
    		hashChange,
    		name,
    		_station,
    		$maxDate,
    		tfmt,
    		parseRow,
    		parseStations,
    		load,
    		select_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { name: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*name*/ ctx[7] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
