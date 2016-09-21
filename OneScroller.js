define(function() {
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
        getTime: Date.now || function getTime() {
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
        var that = this;

        /**
         * 运动参数
         */
        this.pointY = 0; // 当前手指位子
        this.y = 0; // 当前位置
        this.deltaY = 0; // 本次偏移量

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
        that.scroller.addEventListener('touchstart', function(ev) {
            ev.preventDefault();
            var e = utils.getEvent(ev);
            var touch = ev.touches[0];
            //运动参数赋值
            that.startTime = new Date().getTime();
            that.pointY = touch.pageY;
            //停止滚动
            that.stopAnimate();
            that.startY = that.y;
        }, false);

        that.scroller.addEventListener('touchmove', function(ev) {
            ev.preventDefault();
            var e = utils.getEvent(ev);
            var touch = ev.touches[0];

            /**
             * 运动参数赋值
             */
            var deltaY = touch.pageY - that.pointY;
            that.pointY = touch.pageY;
            that.distY += deltaY;
            var newY = that.y + deltaY;
            var absDistY = Math.abs(that.distY);
            var timestamp = new Date().getTime();



            // 触摸时间和距离不附和触发条件
            if (timestamp - this.endTime > 300 && absDistY < 10) {
                return;
            }

            // 超出边界时下拉、上拉摩擦力
            if (newY > 0 || newY < that.maxScrollY) {
                newY = that.y + deltaY / 3;
            }

            // 方向
            this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            //滚动
            that.translate(newY);

            //如果长按屏幕超过300ms就开始，重新赋值
            var deltaTime = timestamp - that.startTime;
            if (deltaTime > 300) {
                that.startTime = timestamp;
                that.startY = that.y;
            }


        }, false);

        that.scroller.addEventListener('touchend', function(ev) {
            ev.preventDefault();
            var e = utils.getEvent(ev);
            var touch = ev.changedTouches[0];


            that.endTime = new Date().getTime();
            var duration = new Date().getTime() - that.startTime;

            // 如果朝边界就复位
            if (that.resetPosition()) {
                return;
            }

            var newY = Math.round(that.y);
            that.scrollTo(newY);

            var time = 0;
            var easing = '';

            // start momentum animation if needed
            if (duration < 300) {
                momentumY = utils.momentum(
                    that.y,
                    that.startY,
                    duration,
                    that.maxScrollY,
                    that.wrapperHeight,
                    undefined
                );
                newY = momentumY.destination;
                time = momentumY.duration;
            }
            console.log(that.y);
            console.log(that.startY);
            console.log(duration);
            console.log(that.wrapperHeight);
            console.log(that.scrollerHeight);
            console.log(that.maxScrollY);
            console.log('=================');

            if (newY != this.y) {
                // change easing function when scroller goes out of the boundaries
                console.log("newY:" + newY);

                that.scrollTo(newY);
                return;
            }


        }, false);

        that.scroller.addEventListener('transitionend', function(ev) {
            that._transitionEnd(ev);
        }, false);

    };

    OneScroller.prototype._initEvent = function() {

    };
    OneScroller.prototype.stopAnimate = function() {
        this.scrollerStyle['webkitTransition'] = '';
        this.scrollerStyle['transition'] = '';
    };
    OneScroller.prototype.translate = function(y) {
        var cubic_bezier = "0,0,.58,1";
        var duration_time = "600ms";

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
    OneScroller.prototype.scrollTo = function(y) {
        this.scrollerStyle['transitionTimingFunction'] = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        this.scrollerStyle['transitionDuration'] = '550ms';
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

        this.scrollTo(y);

        return true;
    };
    OneScroller.prototype._transitionEnd = function(e) {
        if (e.target != this.scroller) {
            return;
        }

        //this._transitionTime();
        if (!this.resetPosition()) {

        }
    }


    return OneScroller;
});
