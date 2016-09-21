(function(window, document, Math) {
    var utils = {
        ease: {
            quadratic: { //二次效果
                style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fn: function(k) {
                    return k * (2 - k);
                }
            },
            circular: { // 循环效果
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',
                // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                fn: function(k) {
                    return Math.sqrt(1 - (--k * k));
                }
            },
            back: {
                style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fn: function(k) {
                    var b = 4;
                    return (k = k - 1) * k * ((b + 1) * k + b) + 1;
                }
            },
            bounce: { // 弹力效果
                style: '',
                fn: function(k) {
                    if ((k /= 1) < (1 / 2.75)) {
                        return 7.5625 * k * k;
                    } else if (k < (2 / 2.75)) {
                        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                    } else if (k < (2.5 / 2.75)) {
                        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                    } else {
                        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                    }
                }
            },
            elastic: {
                style: '',
                fn: function(k) {
                    var f = 0.22,
                        e = 0.4;

                    if (k === 0) {
                        return 0;
                    }
                    if (k == 1) {
                        return 1;
                    }
                    return (e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
                }
            }
        },




        extend: function(target, obj) {
            for (var i in obj) {
                target[i] = obj[i];
            }
        },
        addEvent: function(el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        },
        removeEvent: function(el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        },
        getTime: function getTime() {
            return new Date().getTime();
        },
        /**
         * 获取event
         * @param  {[JSON]} event [回调的事件对象]
         * @return {[JSON]}       [供使用的事件对象]
         */
        getEvent: function(event) {
            return event ? event : window.event;
        },
        stopAnimate: function(obj) {

        },
        momentum: function(current, start, time, lowerMargin, wrapperSize, deceleration) {
            var distance = current - start,
                speed = Math.abs(distance) / time,
                destination,
                duration;

            deceleration = deceleration === undefined ? 0.0006 : deceleration;

            destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1);
            duration = speed / deceleration;

            if (destination < lowerMargin) {
                destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
                distance = Math.abs(destination - current);
                duration = distance / speed;
            } else if (destination > 0) {
                destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
                distance = Math.abs(current) + destination;
                duration = distance / speed;
            }

            return {
                destination: Math.round(destination),
                duration: duration
            };
        }
    };


    var OneScroller = function(el, options) {
        /**
         * 运动参数
         */
        this.pointY = 0; // 上次最后移动位置
        this.y = 0; // 当前位置
        this.deltaY = 0; // 本次偏移量
        this.distY = 0; // 重移动距离

        this.startTime = 0; // 开始时间

        //容器参数
        this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
        this.scroller = this.wrapper.children[0];
        this.scrollerStyle = this.scroller.style; // cache style for better performance
        this.wrapperHeight = this.wrapper.clientHeight;
        this.scrollerHeight = this.scroller.offsetHeight;
        this.maxScrollY = this.wrapperHeight - this.scrollerHeight;

        this.options = {
            bounceTime: 600,
            bounceEasing: '',
            startY: 0, // 开始的位子
            debug: false // 如果你想调试开发，输出相关值到console
        };

        utils.extend(this.options, options);

        // 滚动到顶部
        this.scrollTo(this.options.startY);


        //事件绑定
        this._initEvent();

    };

    OneScroller.prototype._initEvent = function() {
        utils.addEvent(this.scroller, 'touchstart', this);
        utils.addEvent(this.scroller, 'touchmove', this);
        utils.addEvent(this.scroller, 'touchend', this);
        utils.addEvent(this.scroller, 'transitionend', this);
    };

    OneScroller.prototype.handleEvent = function(ev) {
        switch (ev.type) {
            case "touchstart":
                this._start(ev);
                break;
            case "touchmove":
                this._move(ev);
                break;
            case "touchend":
                this._end(ev);
                break;
            case "transitionend":
                this._transitionend(ev);
                break;
        }
    }

    OneScroller.prototype._start = function(ev) {
        ev.preventDefault();
        var ev = utils.getEvent(ev);
        var touch = ev.touches[0];

        //运动参数赋值
        this.startTime = utils.getTime();
        this.pointY = touch.pageY;

        var pos = this.getComputedPosition();
        this.stopAnimate();
        this.translate(Math.round(pos.y));
        console.log(pos);

        // 重新赋值开始位置
        this.startY = this.y;
    };

    OneScroller.prototype._move = function(ev) {
        ev.preventDefault();
        var e = utils.getEvent(ev);
        var touch = ev.touches[0];

        //运动参数赋值
        var deltaY = touch.pageY - this.pointY;
        this.pointY = touch.pageY;
        this.distY += deltaY;

        var newY = this.y + deltaY;
        var absDistY = Math.abs(this.distY);
        var timestamp = utils.getTime();

        // 触摸时间和距离不附和触发条件
        if (timestamp - this.endTime > 300 && absDistY < 10) {
            return;
        }

        // 超出边界时下拉、上拉摩擦力
        if (newY > 0 || newY < this.maxScrollY) {
            newY = this.y + deltaY / 3;
        }

        // 方向
        this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;


        //滚动
        this.translate(newY, 0, null);

        //如果长按屏幕超过300ms就开始，重新赋值
        var deltaTime = timestamp - this.startTime;
        if (deltaTime > 300) {
            this.startTime = timestamp;
            this.startY = this.y;
        }
    };

    OneScroller.prototype._end = function(ev) {
        ev.preventDefault();
        var e = utils.getEvent(ev);
        var touch = ev.changedTouches[0];


        this.endTime = utils.getTime();
        var duration = utils.getTime() - this.startTime;

        // 如果朝边界就复位
        if (this.resetPosition()) {
            return;
        }

        var newY = Math.round(this.y);
        this.scrollTo(newY);

        var time = 0;
        var easing = '';

        // 开始计算惯性值
        if (duration < 300) {
            momentumY = utils.momentum(
                this.y,
                this.startY,
                duration,
                this.maxScrollY,
                this.wrapperHeight,
                undefined
            );
            newY = momentumY.destination;
            time = momentumY.duration;
        }

        if (newY != this.y) {
            // change easing function when scroller goes out of the boundaries
            if (newY > 0 || newY < this.maxScrollY) {
                easing = utils.ease.quadratic;
            }
            //console.log(time);
            //bug1: 不知道冲击滑动为什么会小弹一下
            //fixed it.
            newY += this.directionY * 30;
            this.scrollTo(newY, time, easing);
            return;
        }

    };
    OneScroller.prototype._transitionend = function(ev) {
        this._transitionEnd(ev);
    };

    OneScroller.prototype.stopAnimate = function() {
        this.scrollerStyle['webkitTransition'] = '';
        this.scrollerStyle['transition'] = '';
    };
    OneScroller.prototype.translate = function(y) {


        this.scrollerStyle['webkitTransform'] = 'translate3d(0px, ' + y + 'px, 0px)';
        this.scrollerStyle['transform'] = 'translate3d(0px, ' + y + 'px, 0px)';
        this.y = y;
    };
    OneScroller.prototype.velocity = function(time, distination, log) {
        this.speed = distination / (time / 1000);
        this.speed = isNaN(this.speed) ? 0 : this.speed;
        console.log('滚动距离：' + distination + ' 滚动时间：' + (time / 1000) + ' 速度：' + this.speed);
        if (log) {
            log.innerHTML = '滚动距离：' + distination + ' 滚动时间：' + (time / 1000) + ' 速度：' + this.speed;
        }
    };
    OneScroller.prototype.getComputedPosition = function() {
        var matrix = window.getComputedStyle(this.scroller, null),
            x, y;


        matrix = matrix['transform'].split(')')[0].split(', ');
        x = +(matrix[12] || matrix[4]);
        y = +(matrix[13] || matrix[5]);


        return { x: x, y: y };
    };

    OneScroller.prototype.scrollTo = function(y, time, easing) {
        easing = easing || utils.ease.circular;
        time = time || 550;

        this.scrollerStyle['transitionTimingFunction'] = easing.style;
        this.scrollerStyle['transitionDuration'] = time + 'ms';
        this.translate(y);
    };
    OneScroller.prototype.resetPosition = function(time) {
        var x = this.x,
            y = this.y;

        time = time || 0;



        if (this.y > 0) {
            y = 0;
        } else if (this.y < this.maxScrollY) {
            y = this.maxScrollY;
        }

        if (y == this.y) {
            return false;
        }

        this.scrollTo(y, time);

        return true;
    };
    OneScroller.prototype._transitionEnd = function(e) {
        if (e.target != this.scroller) {
            return;
        }

        //this._transitionTime();
        if (!this.resetPosition(this.options.bounceTime)) {

        }
    };

    OneScroller.prototype._transitionTime = function(time) {

        time = time || 0;
        var durationProp = utils.style.transitionDuration;
        if (!durationProp) {
            return;
        }

        this.scrollerStyle[durationProp] = time + 'ms';

        if (!time && utils.isBadAndroid) {
            this.scrollerStyle[durationProp] = '0.0001ms';
            // remove 0.0001ms
            var self = this;
            rAF(function() {
                if (self.scrollerStyle[durationProp] === '0.0001ms') {
                    self.scrollerStyle[durationProp] = '0s';
                }
            });
        }


    };


    if (typeof module != 'undefined' && module.exports) {
        module.exports = OneScroller;
    } else if (typeof define == 'function' && define.amd) {
        define(function() {
            return OneScroller;
        });
    } else {
        window.OneScroller = OneScroller;
    }

})(window, document, Math);
