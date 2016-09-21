define(function() {
    //滚动条

    var yScroll = function(entity, params) {
        var that = this,
            options = {
                onScrollStart: null,
                onScrollMove: null,
                onScrollEnd: null
            },
            startY, defineY, deltaY = 0,
            startTime, startTamp, minusNewY, axis, clickY = 0;
        params = params || {};
        for (var i in options) {
            if (params[i] == that.und) {
                params[i] = options[i]
            }
        }
        that.param = params;
        that.wrapper = entity, that.scroller = entity.firstElementChild;
        var wrapperHeight = that.wrapper.clientHeight,
            scrollerHeight = that.scroller.clientHeight;
        var scrollRange = wrapperHeight - scrollerHeight;
        that.maxScrollY = wrapperHeight - scrollerHeight;
        if (scrollRange > 0) { // 如果容器高度大于内容高度
            that.isRange = true;
        }
        that.scroller.addEventListener('touchstart', function(event) {
        	
            var e = that.getEvent(event),
                touch = e.touches[0];
            startY = touch.pageY; // 开始Y坐标
            startTime = +new Date(); // 开始时间
            minusNewY = that.newY;
            defineY = that.newY;
            that.scrollStart();
            that.scroller.style['webkitTransition'] = ''; // 停止滚动
        }, false);
        that.scroller.addEventListener('touchmove', function(e) {
            e.preventDefault();
            var touch = e.touches[0];
            deltaY = touch.pageY - startY; //Y坐标偏移量
            startY = touch.pageY; // 重设开始Y坐标
            deltaY += that.newY;
            clickY = deltaY; // Y坐标偏移量
            // 做一个顶、底部阈值判断
            //console.log("deltaY:" + deltaY);
            // console.log("wrapperHeight:"+wrapperHeight);
            // console.log("scrollerHeight:"+that.scroller[0].offsetHeight);
            // console.log("that.maxScrollY:"+that.maxScrollY);
            // console.log("-sw:"+(wrapperHeight-that.scroller[0].offsetHeight));
            var sw = that.scroller.offsetHeight - wrapperHeight;
            console.log(deltaY);
            if (deltaY > 0) {
                var dt = deltaY / 4;
                that.scroller.style['webkitTransform'] = "translate3d(0px, " + (dt) + "px, 0px)";
                that.scroller.style['webkitTransformDuration'] = "0s";
            } else if (deltaY < -sw) {
                var dt = -sw - (Math.abs(deltaY) - sw) / 4;
                console.log(dt);
                that.scroller.style['webkitTransform'] = "translate3d(0px, " + (dt) + "px, 0px)";
                that.scroller.style['webkitTransformDuration'] = "0s";
            } else {
                that.scroller.style['webkitTransform'] = "translate3d(0px, " + (deltaY) + "px, 0px)";
                that.scroller.style['webkitTransformDuration'] = "0s";
            }
            that.scrollMove();
            that.newY = deltaY; // 新坐标
            startTamp = +new Date();
        }, false);
        that.scroller.addEventListener('touchend', function() {
            var durations = +(new Date() - startTamp) * 10, // 触碰总时间
                example = that.scroller,
                durations2 = (new Date() - startTime);
            if (durations2 > 280) return; // 设定最小滚动阈值
            //console.log(Math.abs(defineY) - Math.abs(deltaY) + " durations:" + durations);

            if (clickY != 0) { // 如果Y坐标偏移

                defineY -= (Math.abs(defineY) - Math.abs(deltaY)) * 1.7 > 300 ? 300 : (Math.abs(defineY) - Math.abs(deltaY)) * 1.7;
                var dis = that.velocity(deltaY, defineY, durations, that.maxScrollY, 0);
                that.scrollY(example, (dis.destination), that.scrollEnd);
                if (that.isRange) {
                    that.scrollY(example, 0, that.scrollEnd, true);
                } else {
                    if (dis.destination > 0) {
                        that.scrollY(example, 0, that.scrollEnd, true);
                    }
                    if (dis.destination < that.maxScrollY) {
                        that.scrollY(example, that.maxScrollY, that.scrollEnd, true);
                    }
                }
            }
            clickY = 0;
        }, false);
    };
    yScroll.prototype = {
        param: {},
        isRange: false,
        und: void(0),
        newY: 0,
        wrapper: null,
        scroller: null,
        maxScrollY: 0,
        //_start:
        scrollStart: function() {
            if (this.param.onScrollStart && typeof(this.param.onScrollStart) == 'function') {
                this.param.onScrollStart.call(this.scroller);
            } else {
                return false;
            }
        },
        //_move:
        scrollMove: function() {
            if (this.param.onScrollMove && typeof(this.param.onScrollMove) == 'function') {
                this.param.onScrollMove.call(this.scroller);
            } else {
                return false;
            }
        },
        //_end:
        scrollEnd: function() {
            if (this.param.onScrollEnd && typeof(this.param.onScrollEnd) == 'function') {
                this.param.onScrollEnd.call(this.scroller);
            } else {
                return false;
            }
        },
        //移动
        scrollY: function(obj, y, fn, end) {
            if (obj == this.und || y == this.und) {
                return;
            }
            var cubic_bezier = "0,0,.58,1";
            if (end) cubic_bezier = "0,0,.8,1.13";
            var duration_time = "600ms";
            if (end) duration_time = "200ms";
            this.scroller.style['webkitTransitionTimingFunction'] = 'cubic-bezier(' + cubic_bezier + ')';
            this.scroller.style['webkitTransform'] = "translate3d(0px, " + (y) + "px, 0px)";
            this.scroller.style['webkitTransitionDuration'] = duration_time;

            var ex = this;
            if (fn) {
                setTimeout(function() {
                    fn.call(ex);
                }, 500);
            }
            this.newY = parseInt(y);
        },
        scrollTo: function(x, y, time, easing) {
            easing = easing || {
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', //
                fn: function(k) {
                    return Math.sqrt(1 - (--k * k));
                }
            };
            //time > 0;
            if (!time || easing.style) {
                this._transitionTimingFunction(easing.style);
                this._transitionTime(time);
                this._translate(x, y);
            }
        },
        //获取event
        getEvent: function(event) {
            return event ? event : window.event;
        },
        //惯性：V＝s/t（定义式)/ v = ;mv = Ft
        velocity: function(cur, start, time, maxBot, minTop) {
            var dist = cur - start,
                speed = Math.abs(dist) / time,
                destination,
                duration,
                scale = 4.5,
                deceleration = 0.0006 * scale;
            //加速度s：m/s2
            if (dist == 0) {
                return {
                    destination: 0
                };
            }
            destination = cur + (speed * speed) / (2 * deceleration) * (dist < 0 ? -1 : 1);
            duration = speed / deceleration;
            return {
                destination: destination.toFixed(2),
                duration: duration
            };
        },
        //刷新滚动条
        refresh: function() {
            this.maxScrollY = (this.wrapper[0].clientHeight) - (this.wrapper[0].firstElementChild.offsetHeight);
        },
        //获取鼠标信息
        getMousePos: function(event) {
            var top, left;
            top = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
            left = Math.max(document.body.scrollLeft, document.documentElement.scrollLeft);
            return {
                top: top + event.clientY,
                left: left + event.clientX
            };
        },
        //获取相对位置
        getY: function(obj) {
            var parObj = obj;
            var top = obj.offsetTop;
            while (parObj = parObj.offsetParent) {
                top += parObj.offsetTop;
            }
            return top;
        }
    }

    return yScroll;
});
