
Template.board_view_timeline.clock_running = function() {
    return true;
}

Template.board_view_timeline_svg.rendered = function() {
    var self = this;
    self.svg = self.find('#svgtimeline');
    self.axis = self.find('#svgtimeline g.axis');
    self.dedications = self.find('#svgtimeline g.dedications');

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
            .tickSize(30, 30);

        var xTicks = d3.select(self.axis).call(xAxis);
        xTicks.selectAll("text")
            .attr("transform", "translate(18, -30)");
    }

    // Draws a single dedication rect
    var drawDedication = function(dedicationRect) {
        dedicationRect
            .attr('data-id', function (dedication) { return dedication._id; })
            .attr('class', 'dedication')
            .attr('x', function (dedication) { return self.xScale(dedication.starts_at); })
            .attr('y', '15')
            .attr('width', function (dedication) { 
                if (dedication.duration == -1) {
                    return self.xScale(new Date().getTime()) - self.xScale(dedication.starts_at);
                } else {
                    return self.xScale(dedication.starts_at + dedication.duration*1000) - self.xScale(dedication.starts_at);
                }
            })
            .attr('height', '15');
    }

    // draws all dedications
    var drawAllDedications = function() {
        if (!self.dedicationRects) {
            return;
        }

        // Append new dedications
        drawDedication(self.dedicationRects.enter().append('rect'));

        // Update changed dedications
        drawDedication(self.dedicationRects.transition().duration(400));

        // Remove dedications
        self.dedicationRects
            .exit()
            .transition()
            .duration(400)
            .style('opacity', 0)
            .remove(); 
    }

    var updateAll = function () {
        setXScale();
        drawTicks();
        drawAllDedications();
        Meteor.setTimeout( function() {
        $(self.svg).parent().scrollLeft($(self.svg).width());
        }, 500);
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

        self.dedicationRects = d3.select(self.dedications)
            .selectAll("rect")
            .data(dedications, function (d) { return d._id; }); 

        console.log("redrawOnNewData");

        // TODO: do this with a timeout of 1s, one time per second at most
        drawAllDedications();
    });
}


Template.board_view_timeline_svg.destroyed = function() {
    this.redrawOnNewData.stop();
}