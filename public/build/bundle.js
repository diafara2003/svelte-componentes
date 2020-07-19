
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
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
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
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
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Design/Header.svelte generated by Svelte v3.24.0 */

    const file = "src/Design/Header.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			span = element("span");
    			t = text(/*titulo*/ ctx[0]);
    			attr_dev(span, "class", "navbar-brand mb-0 h1");
    			add_location(span, file, 6, 2, 86);
    			attr_dev(nav, "class", "navbar navbar-dark bg-dark");
    			add_location(nav, file, 5, 0, 43);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*titulo*/ 1) set_data_dev(t, /*titulo*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
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
    	let { titulo = "" } = $$props;
    	const writable_props = ["titulo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);

    	$$self.$set = $$props => {
    		if ("titulo" in $$props) $$invalidate(0, titulo = $$props.titulo);
    	};

    	$$self.$capture_state = () => ({ titulo });

    	$$self.$inject_state = $$props => {
    		if ("titulo" in $$props) $$invalidate(0, titulo = $$props.titulo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [titulo];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { titulo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get titulo() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set titulo(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Design/Post/Card.svelte generated by Svelte v3.24.0 */

    const file$1 = "src/Design/Post/Card.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h5;
    	let t1;
    	let t2;
    	let p;
    	let t3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h5 = element("h5");
    			t1 = text(/*titulo*/ ctx[0]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*descripcion*/ ctx[2]);
    			if (img.src !== (img_src_value = /*imagen*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*titulo*/ ctx[0]);
    			set_style(img, "width", "100%");
    			set_style(img, "height", "200px");
    			add_location(img, file$1, 7, 2, 144);
    			attr_dev(h5, "class", "card-title");
    			add_location(h5, file$1, 10, 4, 242);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$1, 11, 4, 283);
    			attr_dev(div0, "class", "card-body");
    			add_location(div0, file$1, 9, 2, 214);
    			attr_dev(div1, "class", "card");
    			set_style(div1, "width", "18res");
    			add_location(div1, file$1, 6, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h5);
    			append_dev(h5, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imagen*/ 2 && img.src !== (img_src_value = /*imagen*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*titulo*/ 1) {
    				attr_dev(img, "alt", /*titulo*/ ctx[0]);
    			}

    			if (dirty & /*titulo*/ 1) set_data_dev(t1, /*titulo*/ ctx[0]);
    			if (dirty & /*descripcion*/ 4) set_data_dev(t3, /*descripcion*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { titulo = "" } = $$props;
    	let { imagen = "" } = $$props;
    	let { descripcion = "" } = $$props;
    	const writable_props = ["titulo", "imagen", "descripcion"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, []);

    	$$self.$set = $$props => {
    		if ("titulo" in $$props) $$invalidate(0, titulo = $$props.titulo);
    		if ("imagen" in $$props) $$invalidate(1, imagen = $$props.imagen);
    		if ("descripcion" in $$props) $$invalidate(2, descripcion = $$props.descripcion);
    	};

    	$$self.$capture_state = () => ({ titulo, imagen, descripcion });

    	$$self.$inject_state = $$props => {
    		if ("titulo" in $$props) $$invalidate(0, titulo = $$props.titulo);
    		if ("imagen" in $$props) $$invalidate(1, imagen = $$props.imagen);
    		if ("descripcion" in $$props) $$invalidate(2, descripcion = $$props.descripcion);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [titulo, imagen, descripcion];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { titulo: 0, imagen: 1, descripcion: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get titulo() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set titulo(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imagen() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imagen(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get descripcion() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set descripcion(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Design/Post/Card-Grid.svelte generated by Svelte v3.24.0 */
    const file$2 = "src/Design/Post/Card-Grid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (9:2) {#each post as p}
    function create_each_block(ctx) {
    	let div;
    	let card;
    	let t;
    	let current;

    	card = new Card({
    			props: {
    				titulo: /*p*/ ctx[1].titulo,
    				imagen: /*p*/ ctx[1].imagen,
    				descripcion: /*p*/ ctx[1].descripcion
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "col-sm-4");
    			add_location(div, file$2, 9, 4, 128);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*post*/ 1) card_changes.titulo = /*p*/ ctx[1].titulo;
    			if (dirty & /*post*/ 1) card_changes.imagen = /*p*/ ctx[1].imagen;
    			if (dirty & /*post*/ 1) card_changes.descripcion = /*p*/ ctx[1].descripcion;
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(9:2) {#each post as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let each_value = /*post*/ ctx[0];
    	validate_each_argument(each_value);
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "row p-2");
    			add_location(div, file$2, 6, 0, 81);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*post*/ 1) {
    				each_value = /*post*/ ctx[0];
    				validate_each_argument(each_value);
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
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
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
    			destroy_each(each_blocks, detaching);
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
    	let { post = [] } = $$props;
    	const writable_props = ["post"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card_Grid> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card_Grid", $$slots, []);

    	$$self.$set = $$props => {
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    	};

    	$$self.$capture_state = () => ({ Card, post });

    	$$self.$inject_state = $$props => {
    		if ("post" in $$props) $$invalidate(0, post = $$props.post);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [post];
    }

    class Card_Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { post: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card_Grid",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get post() {
    		throw new Error("<Card_Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<Card_Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Design/Inputcustom.svelte generated by Svelte v3.24.0 */

    const file$3 = "src/Design/Inputcustom.svelte";

    // (22:2) {:else}
    function create_else_block(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", /*type*/ ctx[3]);
    			attr_dev(input, "id", /*id*/ ctx[5]);
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[2]);
    			input.value = /*value*/ ctx[1];
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$3, 22, 4, 383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_handler_1*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*type*/ 8) {
    				attr_dev(input, "type", /*type*/ ctx[3]);
    			}

    			if (dirty & /*id*/ 32) {
    				attr_dev(input, "id", /*id*/ ctx[5]);
    			}

    			if (dirty & /*placeholder*/ 4) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				prop_dev(input, "value", /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(22:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:2) {#if control === 'textarea'}
    function create_if_block(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "id", /*id*/ ctx[5]);
    			attr_dev(textarea, "placeholder", /*placeholder*/ ctx[2]);
    			textarea.value = /*value*/ ctx[1];
    			attr_dev(textarea, "rows", "10");
    			attr_dev(textarea, "cols", "30");
    			attr_dev(textarea, "class", "form-control");
    			add_location(textarea, file$3, 13, 4, 237);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);

    			if (!mounted) {
    				dispose = listen_dev(textarea, "input", /*input_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id*/ 32) {
    				attr_dev(textarea, "id", /*id*/ ctx[5]);
    			}

    			if (dirty & /*placeholder*/ 4) {
    				attr_dev(textarea, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 2) {
    				prop_dev(textarea, "value", /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:2) {#if control === 'textarea'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let label;
    	let t0;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*control*/ ctx[0] === "textarea") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(/*nombre*/ ctx[4]);
    			t1 = space();
    			if_block.c();
    			attr_dev(label, "id", /*id*/ ctx[5]);
    			add_location(label, file$3, 10, 2, 172);
    			attr_dev(div, "class", "form group");
    			add_location(div, file$3, 9, 0, 145);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(div, t1);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nombre*/ 16) set_data_dev(t0, /*nombre*/ ctx[4]);

    			if (dirty & /*id*/ 32) {
    				attr_dev(label, "id", /*id*/ ctx[5]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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
    	let { control } = $$props;
    	let { value } = $$props;
    	let { placeholder } = $$props;
    	let { type } = $$props;
    	let { nombre } = $$props;
    	let { id } = $$props;
    	const writable_props = ["control", "value", "placeholder", "type", "nombre", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Inputcustom> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Inputcustom", $$slots, []);

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("control" in $$props) $$invalidate(0, control = $$props.control);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("nombre" in $$props) $$invalidate(4, nombre = $$props.nombre);
    		if ("id" in $$props) $$invalidate(5, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		control,
    		value,
    		placeholder,
    		type,
    		nombre,
    		id
    	});

    	$$self.$inject_state = $$props => {
    		if ("control" in $$props) $$invalidate(0, control = $$props.control);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("nombre" in $$props) $$invalidate(4, nombre = $$props.nombre);
    		if ("id" in $$props) $$invalidate(5, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [control, value, placeholder, type, nombre, id, input_handler, input_handler_1];
    }

    class Inputcustom extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			control: 0,
    			value: 1,
    			placeholder: 2,
    			type: 3,
    			nombre: 4,
    			id: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Inputcustom",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*control*/ ctx[0] === undefined && !("control" in props)) {
    			console.warn("<Inputcustom> was created without expected prop 'control'");
    		}

    		if (/*value*/ ctx[1] === undefined && !("value" in props)) {
    			console.warn("<Inputcustom> was created without expected prop 'value'");
    		}

    		if (/*placeholder*/ ctx[2] === undefined && !("placeholder" in props)) {
    			console.warn("<Inputcustom> was created without expected prop 'placeholder'");
    		}

    		if (/*type*/ ctx[3] === undefined && !("type" in props)) {
    			console.warn("<Inputcustom> was created without expected prop 'type'");
    		}

    		if (/*nombre*/ ctx[4] === undefined && !("nombre" in props)) {
    			console.warn("<Inputcustom> was created without expected prop 'nombre'");
    		}

    		if (/*id*/ ctx[5] === undefined && !("id" in props)) {
    			console.warn("<Inputcustom> was created without expected prop 'id'");
    		}
    	}

    	get control() {
    		throw new Error("<Inputcustom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set control(value) {
    		throw new Error("<Inputcustom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Inputcustom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Inputcustom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Inputcustom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Inputcustom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Inputcustom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Inputcustom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nombre() {
    		throw new Error("<Inputcustom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nombre(value) {
    		throw new Error("<Inputcustom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Inputcustom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Inputcustom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.0 */
    const file$4 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let header;
    	let t0;
    	let div;
    	let cardgrid;
    	let t1;
    	let form;
    	let inputcustom0;
    	let t2;
    	let inputcustom1;
    	let t3;
    	let inputcustom2;
    	let t4;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	header = new Header({
    			props: { titulo: "componente" },
    			$$inline: true
    		});

    	cardgrid = new Card_Grid({
    			props: { post: /*post*/ ctx[3] },
    			$$inline: true
    		});

    	inputcustom0 = new Inputcustom({
    			props: {
    				type: "text",
    				nombre: "Titulo",
    				id: "titulo",
    				placeholder: "titulo",
    				value: /*titulo*/ ctx[0]
    			},
    			$$inline: true
    		});

    	inputcustom0.$on("input", /*input_handler*/ ctx[5]);

    	inputcustom1 = new Inputcustom({
    			props: {
    				type: "text",
    				nombre: "Imagen",
    				id: "imagen",
    				placeholder: "imagen",
    				value: /*imagen*/ ctx[2]
    			},
    			$$inline: true
    		});

    	inputcustom1.$on("input", /*input_handler_1*/ ctx[6]);

    	inputcustom2 = new Inputcustom({
    			props: {
    				control: "textarea",
    				nombre: "Descripcion",
    				id: "descripcion",
    				placeholder: "descripcion",
    				value: /*descripcion*/ ctx[1]
    			},
    			$$inline: true
    		});

    	inputcustom2.$on("input", /*input_handler_2*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(cardgrid.$$.fragment);
    			t1 = space();
    			form = element("form");
    			create_component(inputcustom0.$$.fragment);
    			t2 = space();
    			create_component(inputcustom1.$$.fragment);
    			t3 = space();
    			create_component(inputcustom2.$$.fragment);
    			t4 = space();
    			button = element("button");
    			button.textContent = "Guardar";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-info");
    			add_location(button, file$4, 71, 6, 1713);
    			add_location(form, file$4, 46, 2, 1080);
    			attr_dev(div, "class", "container");
    			add_location(div, file$4, 43, 0, 1031);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(cardgrid, div, null);
    			append_dev(div, t1);
    			append_dev(div, form);
    			mount_component(inputcustom0, form, null);
    			append_dev(form, t2);
    			mount_component(inputcustom1, form, null);
    			append_dev(form, t3);
    			mount_component(inputcustom2, form, null);
    			append_dev(form, t4);
    			append_dev(form, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(/*agregarPost*/ ctx[4]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const cardgrid_changes = {};
    			if (dirty & /*post*/ 8) cardgrid_changes.post = /*post*/ ctx[3];
    			cardgrid.$set(cardgrid_changes);
    			const inputcustom0_changes = {};
    			if (dirty & /*titulo*/ 1) inputcustom0_changes.value = /*titulo*/ ctx[0];
    			inputcustom0.$set(inputcustom0_changes);
    			const inputcustom1_changes = {};
    			if (dirty & /*imagen*/ 4) inputcustom1_changes.value = /*imagen*/ ctx[2];
    			inputcustom1.$set(inputcustom1_changes);
    			const inputcustom2_changes = {};
    			if (dirty & /*descripcion*/ 2) inputcustom2_changes.value = /*descripcion*/ ctx[1];
    			inputcustom2.$set(inputcustom2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(cardgrid.$$.fragment, local);
    			transition_in(inputcustom0.$$.fragment, local);
    			transition_in(inputcustom1.$$.fragment, local);
    			transition_in(inputcustom2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(cardgrid.$$.fragment, local);
    			transition_out(inputcustom0.$$.fragment, local);
    			transition_out(inputcustom1.$$.fragment, local);
    			transition_out(inputcustom2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(cardgrid);
    			destroy_component(inputcustom0);
    			destroy_component(inputcustom1);
    			destroy_component(inputcustom2);
    			mounted = false;
    			dispose();
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
    	let titulo = "";
    	let descripcion = "";
    	let imagen = "";

    	let post = [
    		{
    			titulo: "Londres",
    			descripcion: "Big ben",
    			imagen: "https://cdn.pixabay.com/photo/2014/11/13/23/34/london-530055_1280.jpg"
    		},
    		{
    			titulo: "Paris",
    			descripcion: "torre effel",
    			imagen: "https://cdn.pixabay.com/photo/2015/05/15/14/27/eiffel-tower-768501_1280.jpg"
    		},
    		{
    			titulo: "Alemania",
    			descripcion: "centro",
    			imagen: "https://media.istockphoto.com/photos/empty-brandenburg-gate-during-the-covid19-crisis-picture-id1214542835"
    		}
    	];

    	function agregarPost() {
    		const nuevoPost = {
    			id: Math.random.toString(),
    			titulo,
    			descripcion,
    			imagen
    		};

    		$$invalidate(3, post = [nuevoPost, ...post]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const input_handler = event => $$invalidate(0, titulo = event.target.value);
    	const input_handler_1 = event => $$invalidate(2, imagen = event.target.value);
    	const input_handler_2 = event => $$invalidate(1, descripcion = event.target.value);

    	$$self.$capture_state = () => ({
    		Header,
    		CardGrid: Card_Grid,
    		Inputcustom,
    		titulo,
    		descripcion,
    		imagen,
    		post,
    		agregarPost
    	});

    	$$self.$inject_state = $$props => {
    		if ("titulo" in $$props) $$invalidate(0, titulo = $$props.titulo);
    		if ("descripcion" in $$props) $$invalidate(1, descripcion = $$props.descripcion);
    		if ("imagen" in $$props) $$invalidate(2, imagen = $$props.imagen);
    		if ("post" in $$props) $$invalidate(3, post = $$props.post);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		titulo,
    		descripcion,
    		imagen,
    		post,
    		agregarPost,
    		input_handler,
    		input_handler_1,
    		input_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
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
