
Template.board_view_timeline.clock_running = function() {
    return true;
}

Template.board_view_timeline_svg.rendered = function() {
    var self = this;
    self.svg = self.find('#svgtimeline');
    self.axis = self.find('#svgtimeline g.axis');
    self.dedications = self.find('#svgtimeline g.dedications');

    function timeFormat(formats) {
        return function(date) {
            var i = formats.length - 1, f = formats[i];
            while (!f[1](date)) f = formats[--i];
            d3.select(this.parentNode).classed("format" + i, true);

            var ret = f[0](date);

            if (i == 4 && date.getHours() == 12) {
                d3.select(this.parentNode).classed("midday", true);
            }
            return ret;
        };
    }

    var customTimeFormat = timeFormat([
        [d3.time.format("%Y"), function() { return true; }],
        [d3.time.format("%B"), function(d) { return d.getMonth(); }],
        [d3.time.format("%b %d"), function(d) { return d.getDate() != 1; }],
        [d3.time.format("%a %d"), function(d) { return d.getDay() && d.getDate() != 1; }],
        [d3.time.format("%I %p"), function(d) { return d.getHours(); }],
        [d3.time.format("%I:%M"), function(d) { return d.getMinutes(); }],
        [d3.time.format(":%S"), function(d) { return d.getSeconds(); }],
        [d3.time.format(".%L"), function(d) { return d.getMilliseconds(); }]
    ]);

    // Sets the xScale, which should change depending on window size, and also
    // resizes properly the timeline
    var setXScale = function() {
        var now = new Date();
        var weekAgo = new Date(now.getTime() - 1000*3600*24*2);

        self.xScale = d3.time.scale()
            .domain([weekAgo, now])
            .range([0, $(self.svg).width()]);
    }

    var drawTicks = function() {
        var xAxis = d3.svg.axis()
            .scale(self.xScale)
            .orient("bottom")
            .ticks(d3.time.hours, 3)
            .tickSize(30, 30)
            .tickFormat(customTimeFormat);

        var xTicks = d3.select(self.axis).call(xAxis);
        xTicks.selectAll("text")
            .attr("transform", "translate(18, -30)");
    }

    // Draws a single dedication rect
    var drawDedication = function(dedications) {
        dedications
            .attr('class', 'dedication')
            .attr('data-id', function (dedication) { return dedication._id; })
            .attr('transform', function (dedication) {
                return 'translate(' + self.xScale(dedication.starts_at) + ', 15)';
            });

        // create clippath
        dedications
            .append('clipPath')
            .attr('id', function (dedication) { return "dedication_clip_" + dedication._id; })
            .append('rect')
            .attr('x', '0')
            .attr('y', '0')
            .attr('ry', '2')
            .attr('ry', '2')
            .attr('width', function (dedication) { 
                if (dedication.duration == -1) {
                    return self.xScale(new Date().getTime()) - self.xScale(dedication.starts_at);
                } else {
                    return self.xScale(dedication.starts_at + dedication.duration*1000) - self.xScale(dedication.starts_at);
                }
            })
            .attr('height', '15');

        // create rectangle
        dedications
            .append('rect')
            .attr('x', '0')
            .attr('y', '0')
            .attr('ry', '2')
            .attr('ry', '2')
            .attr('width', function (dedication) { 
                if (dedication.duration == -1) {
                    return self.xScale(new Date().getTime()) - self.xScale(dedication.starts_at);
                } else {
                    return self.xScale(dedication.starts_at + dedication.duration*1000) - self.xScale(dedication.starts_at);
                }
            })
            .attr('height', '15');

        // create text
        dedications
            .append('text')
            .attr('class', 'dedication')
            .attr('clip-path', function (dedication) {  return 'url(#dedication_lip_' + dedication._id; })
            .attr('x', '4')
            .attr('y', '11')
            .attr('width', function (dedication) { 
                if (dedication.duration == -1) {
                    return self.xScale(new Date().getTime()) - self.xScale(dedication.starts_at);
                } else {
                    return self.xScale(dedication.starts_at + dedication.duration*1000) - self.xScale(dedication.starts_at);
                }
            })
            .text(function (dedication) {
                return Cards.findOne({uri: dedication.card_uri}).name;
            });
    }

    // draws all dedications
    var drawAllDedications = function() {
        if (!self.dedicationRects) {
            return;
        }

        // Append new dedications
        var dedication_groups = self.dedicationRects.enter().append('g').call(drawDedication);

        // Remove dedications
        self.dedicationRects
            .exit()
            .style('opacity', 0)
            .remove(); 
    }

    var updateAll = function () {
        setXScale();
        drawTicks();
        drawAllDedications();
        Meteor.setTimeout(function() {
            $(self.svg).parent().scrollLeft($(self.svg).width());
        }, 300);
    }

    updateAll();

    // Redraw the timeline AFTER window has been resized, otherwise it might kill my computer.
    $(window).on('resize', function() {
        clearTimeout(this.id);
        this.id = setTimeout(updateAll, 300);
    });

    // Redraw the timeline every minute, because time goes on and it needs to be
    // shown
    Meteor.setInterval(updateAll, 1000*60);

    self.redrawOnNewData = Meteor.autorun(function() {
        var dedications = Dedications.find().fetch();

        clearTimeout(this.id);
        this.id = setTimeout(function() {
            self.dedicationRects = d3.select(self.dedications)
                .selectAll("g")
                .data(dedications, function (d) { return d._id; }); 

            drawAllDedications();
        }, 300);
    });
}


Template.board_view_timeline_svg.destroyed = function() {
    this.redrawOnNewData.stop();
}