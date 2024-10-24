(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@flasher/flasher')) :
    typeof define === 'function' && define.amd ? define(['@flasher/flasher'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.notyf = factory(global.flasher));
})(this, (function (flasher) { 'use strict';

    class AbstractPlugin {
      success(message, title, options) {
        this.flash('success', message, title, options);
      }
      error(message, title, options) {
        this.flash('error', message, title, options);
      }
      info(message, title, options) {
        this.flash('info', message, title, options);
      }
      warning(message, title, options) {
        this.flash('warning', message, title, options);
      }
      flash(type, message, title, options) {
        if (typeof type === 'object') {
          options = type;
          type = options.type;
          message = options.message;
          title = options.title;
        } else if (typeof message === 'object') {
          options = message;
          message = options.message;
          title = options.title;
        } else if (typeof title === 'object') {
          options = title;
          title = options.title;
        }
        if (undefined === message) {
          throw new Error('message option is required');
        }
        const envelope = {
          type,
          message,
          title: title || type,
          options: options || {},
          metadata: {
            plugin: ''
          }
        };
        this.renderOptions(options || {});
        this.renderEnvelopes([envelope]);
      }
    }

    var __assign = function () {
      __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var NotyfNotification = function () {
      function NotyfNotification(options) {
        this.options = options;
        this.listeners = {};
      }
      NotyfNotification.prototype.on = function (eventType, cb) {
        var callbacks = this.listeners[eventType] || [];
        this.listeners[eventType] = callbacks.concat([cb]);
      };
      NotyfNotification.prototype.triggerEvent = function (eventType, event) {
        var _this = this;
        var callbacks = this.listeners[eventType] || [];
        callbacks.forEach(function (cb) {
          return cb({
            target: _this,
            event: event
          });
        });
      };
      return NotyfNotification;
    }();
    var NotyfArrayEvent;
    (function (NotyfArrayEvent) {
      NotyfArrayEvent[NotyfArrayEvent["Add"] = 0] = "Add";
      NotyfArrayEvent[NotyfArrayEvent["Remove"] = 1] = "Remove";
    })(NotyfArrayEvent || (NotyfArrayEvent = {}));
    var NotyfArray = function () {
      function NotyfArray() {
        this.notifications = [];
      }
      NotyfArray.prototype.push = function (elem) {
        this.notifications.push(elem);
        this.updateFn(elem, NotyfArrayEvent.Add, this.notifications);
      };
      NotyfArray.prototype.splice = function (index, num) {
        var elem = this.notifications.splice(index, num)[0];
        this.updateFn(elem, NotyfArrayEvent.Remove, this.notifications);
        return elem;
      };
      NotyfArray.prototype.indexOf = function (elem) {
        return this.notifications.indexOf(elem);
      };
      NotyfArray.prototype.onUpdate = function (fn) {
        this.updateFn = fn;
      };
      return NotyfArray;
    }();
    var NotyfEvent;
    (function (NotyfEvent) {
      NotyfEvent["Dismiss"] = "dismiss";
      NotyfEvent["Click"] = "click";
    })(NotyfEvent || (NotyfEvent = {}));
    var DEFAULT_OPTIONS = {
      types: [{
        type: 'success',
        className: 'notyf__toast--success',
        backgroundColor: '#3dc763',
        icon: {
          className: 'notyf__icon--success',
          tagName: 'i'
        }
      }, {
        type: 'error',
        className: 'notyf__toast--error',
        backgroundColor: '#ed3d3d',
        icon: {
          className: 'notyf__icon--error',
          tagName: 'i'
        }
      }],
      duration: 2000,
      ripple: true,
      position: {
        x: 'right',
        y: 'bottom'
      },
      dismissible: false
    };
    var NotyfView = function () {
      function NotyfView() {
        this.notifications = [];
        this.events = {};
        this.X_POSITION_FLEX_MAP = {
          left: 'flex-start',
          center: 'center',
          right: 'flex-end'
        };
        this.Y_POSITION_FLEX_MAP = {
          top: 'flex-start',
          center: 'center',
          bottom: 'flex-end'
        };
        var docFrag = document.createDocumentFragment();
        var notyfContainer = this._createHTMLElement({
          tagName: 'div',
          className: 'notyf'
        });
        docFrag.appendChild(notyfContainer);
        document.body.appendChild(docFrag);
        this.container = notyfContainer;
        this.animationEndEventName = this._getAnimationEndEventName();
        this._createA11yContainer();
      }
      NotyfView.prototype.on = function (event, cb) {
        var _a;
        this.events = __assign(__assign({}, this.events), (_a = {}, _a[event] = cb, _a));
      };
      NotyfView.prototype.update = function (notification, type) {
        if (type === NotyfArrayEvent.Add) {
          this.addNotification(notification);
        } else if (type === NotyfArrayEvent.Remove) {
          this.removeNotification(notification);
        }
      };
      NotyfView.prototype.removeNotification = function (notification) {
        var _this = this;
        var renderedNotification = this._popRenderedNotification(notification);
        var node;
        if (!renderedNotification) {
          return;
        }
        node = renderedNotification.node;
        node.classList.add('notyf__toast--disappear');
        var handleEvent;
        node.addEventListener(this.animationEndEventName, handleEvent = function (event) {
          if (event.target === node) {
            node.removeEventListener(_this.animationEndEventName, handleEvent);
            _this.container.removeChild(node);
          }
        });
      };
      NotyfView.prototype.addNotification = function (notification) {
        var node = this._renderNotification(notification);
        this.notifications.push({
          notification: notification,
          node: node
        });
        this._announce(notification.options.message || 'Notification');
      };
      NotyfView.prototype._renderNotification = function (notification) {
        var _a;
        var card = this._buildNotificationCard(notification);
        var className = notification.options.className;
        if (className) {
          (_a = card.classList).add.apply(_a, className.split(' '));
        }
        this.container.appendChild(card);
        return card;
      };
      NotyfView.prototype._popRenderedNotification = function (notification) {
        var idx = -1;
        for (var i = 0; i < this.notifications.length && idx < 0; i++) {
          if (this.notifications[i].notification === notification) {
            idx = i;
          }
        }
        if (idx !== -1) {
          return this.notifications.splice(idx, 1)[0];
        }
        return;
      };
      NotyfView.prototype.getXPosition = function (options) {
        var _a;
        return ((_a = options === null || options === void 0 ? void 0 : options.position) === null || _a === void 0 ? void 0 : _a.x) || 'right';
      };
      NotyfView.prototype.getYPosition = function (options) {
        var _a;
        return ((_a = options === null || options === void 0 ? void 0 : options.position) === null || _a === void 0 ? void 0 : _a.y) || 'bottom';
      };
      NotyfView.prototype.adjustContainerAlignment = function (options) {
        var align = this.X_POSITION_FLEX_MAP[this.getXPosition(options)];
        var justify = this.Y_POSITION_FLEX_MAP[this.getYPosition(options)];
        var style = this.container.style;
        style.setProperty('justify-content', justify);
        style.setProperty('align-items', align);
      };
      NotyfView.prototype._buildNotificationCard = function (notification) {
        var _this = this;
        var options = notification.options;
        var iconOpts = options.icon;
        this.adjustContainerAlignment(options);
        var notificationElem = this._createHTMLElement({
          tagName: 'div',
          className: 'notyf__toast'
        });
        var ripple = this._createHTMLElement({
          tagName: 'div',
          className: 'notyf__ripple'
        });
        var wrapper = this._createHTMLElement({
          tagName: 'div',
          className: 'notyf__wrapper'
        });
        var message = this._createHTMLElement({
          tagName: 'div',
          className: 'notyf__message'
        });
        message.innerHTML = options.message || '';
        var mainColor = options.background || options.backgroundColor;
        if (iconOpts) {
          var iconContainer = this._createHTMLElement({
            tagName: 'div',
            className: 'notyf__icon'
          });
          if (typeof iconOpts === 'string' || iconOpts instanceof String) iconContainer.innerHTML = new String(iconOpts).valueOf();
          if (typeof iconOpts === 'object') {
            var _a = iconOpts.tagName,
              tagName = _a === void 0 ? 'i' : _a,
              className_1 = iconOpts.className,
              text = iconOpts.text,
              _b = iconOpts.color,
              color = _b === void 0 ? mainColor : _b;
            var iconElement = this._createHTMLElement({
              tagName: tagName,
              className: className_1,
              text: text
            });
            if (color) iconElement.style.color = color;
            iconContainer.appendChild(iconElement);
          }
          wrapper.appendChild(iconContainer);
        }
        wrapper.appendChild(message);
        notificationElem.appendChild(wrapper);
        if (mainColor) {
          if (options.ripple) {
            ripple.style.background = mainColor;
            notificationElem.appendChild(ripple);
          } else {
            notificationElem.style.background = mainColor;
          }
        }
        if (options.dismissible) {
          var dismissWrapper = this._createHTMLElement({
            tagName: 'div',
            className: 'notyf__dismiss'
          });
          var dismissButton = this._createHTMLElement({
            tagName: 'button',
            className: 'notyf__dismiss-btn'
          });
          dismissWrapper.appendChild(dismissButton);
          wrapper.appendChild(dismissWrapper);
          notificationElem.classList.add("notyf__toast--dismissible");
          dismissButton.addEventListener('click', function (event) {
            var _a, _b;
            (_b = (_a = _this.events)[NotyfEvent.Dismiss]) === null || _b === void 0 ? void 0 : _b.call(_a, {
              target: notification,
              event: event
            });
            event.stopPropagation();
          });
        }
        notificationElem.addEventListener('click', function (event) {
          var _a, _b;
          return (_b = (_a = _this.events)[NotyfEvent.Click]) === null || _b === void 0 ? void 0 : _b.call(_a, {
            target: notification,
            event: event
          });
        });
        var className = this.getYPosition(options) === 'top' ? 'upper' : 'lower';
        notificationElem.classList.add("notyf__toast--" + className);
        return notificationElem;
      };
      NotyfView.prototype._createHTMLElement = function (_a) {
        var tagName = _a.tagName,
          className = _a.className,
          text = _a.text;
        var elem = document.createElement(tagName);
        if (className) {
          elem.className = className;
        }
        elem.textContent = text || null;
        return elem;
      };
      NotyfView.prototype._createA11yContainer = function () {
        var a11yContainer = this._createHTMLElement({
          tagName: 'div',
          className: 'notyf-announcer'
        });
        a11yContainer.setAttribute('aria-atomic', 'true');
        a11yContainer.setAttribute('aria-live', 'polite');
        a11yContainer.style.border = '0';
        a11yContainer.style.clip = 'rect(0 0 0 0)';
        a11yContainer.style.height = '1px';
        a11yContainer.style.margin = '-1px';
        a11yContainer.style.overflow = 'hidden';
        a11yContainer.style.padding = '0';
        a11yContainer.style.position = 'absolute';
        a11yContainer.style.width = '1px';
        a11yContainer.style.outline = '0';
        document.body.appendChild(a11yContainer);
        this.a11yContainer = a11yContainer;
      };
      NotyfView.prototype._announce = function (message) {
        var _this = this;
        this.a11yContainer.textContent = '';
        setTimeout(function () {
          _this.a11yContainer.textContent = message;
        }, 100);
      };
      NotyfView.prototype._getAnimationEndEventName = function () {
        var el = document.createElement('_fake');
        var transitions = {
          MozTransition: 'animationend',
          OTransition: 'oAnimationEnd',
          WebkitTransition: 'webkitAnimationEnd',
          transition: 'animationend'
        };
        var t;
        for (t in transitions) {
          if (el.style[t] !== undefined) {
            return transitions[t];
          }
        }
        return 'animationend';
      };
      return NotyfView;
    }();
    var Notyf = function () {
      function Notyf(opts) {
        var _this = this;
        this.dismiss = this._removeNotification;
        this.notifications = new NotyfArray();
        this.view = new NotyfView();
        var types = this.registerTypes(opts);
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), opts);
        this.options.types = types;
        this.notifications.onUpdate(function (elem, type) {
          return _this.view.update(elem, type);
        });
        this.view.on(NotyfEvent.Dismiss, function (_a) {
          var target = _a.target,
            event = _a.event;
          _this._removeNotification(target);
          target['triggerEvent'](NotyfEvent.Dismiss, event);
        });
        this.view.on(NotyfEvent.Click, function (_a) {
          var target = _a.target,
            event = _a.event;
          return target['triggerEvent'](NotyfEvent.Click, event);
        });
      }
      Notyf.prototype.error = function (payload) {
        var options = this.normalizeOptions('error', payload);
        return this.open(options);
      };
      Notyf.prototype.success = function (payload) {
        var options = this.normalizeOptions('success', payload);
        return this.open(options);
      };
      Notyf.prototype.open = function (options) {
        var defaultOpts = this.options.types.find(function (_a) {
          var type = _a.type;
          return type === options.type;
        }) || {};
        var config = __assign(__assign({}, defaultOpts), options);
        this.assignProps(['ripple', 'position', 'dismissible'], config);
        var notification = new NotyfNotification(config);
        this._pushNotification(notification);
        return notification;
      };
      Notyf.prototype.dismissAll = function () {
        while (this.notifications.splice(0, 1));
      };
      Notyf.prototype.assignProps = function (props, config) {
        var _this = this;
        props.forEach(function (prop) {
          config[prop] = config[prop] == null ? _this.options[prop] : config[prop];
        });
      };
      Notyf.prototype._pushNotification = function (notification) {
        var _this = this;
        this.notifications.push(notification);
        var duration = notification.options.duration !== undefined ? notification.options.duration : this.options.duration;
        if (duration) {
          setTimeout(function () {
            return _this._removeNotification(notification);
          }, duration);
        }
      };
      Notyf.prototype._removeNotification = function (notification) {
        var index = this.notifications.indexOf(notification);
        if (index !== -1) {
          this.notifications.splice(index, 1);
        }
      };
      Notyf.prototype.normalizeOptions = function (type, payload) {
        var options = {
          type: type
        };
        if (typeof payload === 'string') {
          options.message = payload;
        } else if (typeof payload === 'object') {
          options = __assign(__assign({}, options), payload);
        }
        return options;
      };
      Notyf.prototype.registerTypes = function (opts) {
        var incomingTypes = (opts && opts.types || []).slice();
        var finalDefaultTypes = DEFAULT_OPTIONS.types.map(function (defaultType) {
          var userTypeIdx = -1;
          incomingTypes.forEach(function (t, idx) {
            if (t.type === defaultType.type) userTypeIdx = idx;
          });
          var userType = userTypeIdx !== -1 ? incomingTypes.splice(userTypeIdx, 1)[0] : {};
          return __assign(__assign({}, defaultType), userType);
        });
        return finalDefaultTypes.concat(incomingTypes);
      };
      return Notyf;
    }();

    class NotyfPlugin extends AbstractPlugin {
        renderEnvelopes(envelopes) {
            envelopes.forEach((envelope) => {
                var _a;
                const options = Object.assign(Object.assign({}, envelope), envelope.options);
                (_a = this.notyf) === null || _a === void 0 ? void 0 : _a.open(options);
            });
            this.notyf.view.container.dataset.turboTemporary = '';
            this.notyf.view.a11yContainer.dataset.turboTemporary = '';
        }
        renderOptions(options) {
            const nOptions = Object.assign({ duration: options.duration || 5000 }, options);
            nOptions.types = nOptions.types || [];
            nOptions.types.push({
                type: 'info',
                className: 'notyf__toast--info',
                background: '#5784E5',
                icon: {
                    className: 'notyf__icon--info',
                    tagName: 'i',
                },
            });
            nOptions.types.push({
                type: 'warning',
                className: 'notyf__toast--warning',
                background: '#E3A008',
                icon: {
                    className: 'notyf__icon--warning',
                    tagName: 'i',
                },
            });
            this.notyf = this.notyf || new Notyf(nOptions);
        }
    }

    const notyf = new NotyfPlugin();
    flasher.addPlugin('notyf', notyf);

    return notyf;

}));
