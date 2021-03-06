// init plot
plot = $.plot(plot_holder, {}, plot_options);
var updateLegendTimeout = null;
var polyMarker = null;

// updates legend with extrapolated values under the mouse position
function updateLegend(pos) {
    var legend = $(plot_holder + " .legendLabel");
    $(plot_holder + " .legend table").css({'background-color':"rgba(255,255,255,0.9)","pointer-events":"none"});
    legend.each(function() {
        $(this).css({'padding-left':'3px'});
    });


    var i, j, ij, dataset = plot.getData();
    //var axes = plot.getAxes();

    if(dataset.length === 0) return;

    // this loop find the value for each series
    // and updates the legend
    //
    // here we don't snap to existing data point
    for (i = 0; i < dataset.length; ++i) {

        var series = dataset[i];

        // Find the nearest points, x-wise

        for (j = 0; j < series.data.length; ++j) {
            if (series.data[j][0] > pos.x) {
                break;
            }
        }
        if(i === 0) ij = j;

        var y;
        if(series.noInterpolate > 0) { y = series.data[((j===0)?j:j-1)][1]; }
        else {
            var p1 = (j===0) ? null : series.data[j-1];
                p2 = series.data[j];

            if (p1 === null) {
                y = p2[1];
            } else if (p2 === null) {
                y = p1[1];
            } else {
                y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
            }

            y = ((p1 && p1[1] === null) || (p2 && p2[1] === null)) ? null : y.toFixed(2);
        }
        legend.eq(i).text(series.label.replace(/=.*/, "= " + y));
    }

    if(!polyMarker) {
        polyMarker = new google.maps.Marker({
            clickable: true,
            flat: true,
            map: map,
            visible: true,
            icon: null
        });
        google.maps.event.addListener(polyMarker, 'click', function() { mapInfoBox_handle_path({latLng: this.getPosition()}); });
    }

    // this loop finds an existing data point, so we can get coordinates
    // if the crosshair happens to be over null area, we snap to the previous data point
    //
    // to snap accurate to the corresponding LatLng, we need to count the number of null data points
    // then we remove them form the count and we get the index we need for the positions array
    if(follow_vehicle !== null && vehicles[follow_vehicle].positions.length) {
        // adjust index for null data points
        var null_count = 0;
        var data_ref = vehicles[follow_vehicle].graph_data[0];

        if(ij > data_ref.data.length / 2) {
            for(i = data_ref.data.length - 1; i > ij; i--) null_count += (data_ref.data[i][1] === null) ? 1 : 0;
            null_count = data_ref.nulls - null_count * 2;
        } else {
            for(i = 0; i < ij; i++) null_count += (data_ref.data[i][1] === null) ? 1 : 0;
            null_count *= 2;
        }

        // update position
        ij -= null_count + ((null_count===0||null_count===data_ref.nulls) ? 0 : 1);
        if(ij < 0) ij = 0;

        polyMarker.setPosition(vehicles[follow_vehicle].positions[ij]);

        // adjust nite overlay
        var date = new Date(pos.x1);

        nite.setDate(date);
        nite.refresh();
        // set timebox
        $('#timebox').removeClass('present').addClass('past');
        updateTimebox(date);
    }
}

var plot_crosshair_locked = false;

$(plot_holder).bind("click",  function (event) {
    if(plot_crosshair_locked) {
        plot_crosshair_locked = false;
    } else if(event.ctrlKey) {
        plot_crosshair_locked = true;
    }
});
// update legend values on mouse hover
$(plot_holder).bind("plothover",  function (event, pos, item) {
    if(plot_crosshair_locked) return;

    if (!updateLegendTimeout) {
        plot.lockCrosshair();
        plot.setCrosshair(pos);
        updateLegend(pos);
        updateLegendTimeout = setTimeout(function() { updateLegendTimeout = null; }, 40);
    }
});

// double click on the plot clears selection
$(plot_holder).bind("dblclick", function () {
    if(!follow_vehicle) return;

    if(plot_options.xaxis) {
        if(plot_options.xaxis.superzoom == 2) {
            delete plot_options.xaxis;
        }
        else {
            if(plot_options.xaxis.superzoom == 1) {
               if(!confirm("You are about to zoom out to the entire graph. It may hang your browser. Do you wish to continue?")) return;
            }
            plot_options.xaxis = {};
        }
    }

    updateGraph(follow_vehicle);
});

// limit range after selection
$(plot_holder).bind("plotselected", function (event, ranges) {
    if(typeof ranges.xaxis == 'undefined') return;

    if(plot_options.xaxis && plot_options.xaxis.superzoom) plot_options.xaxis.superzoom = 2;

    $.extend(true, plot_options, {
        xaxis: {
            min: ranges.xaxis.from,
            max: ranges.xaxis.to
        }
    });

    updateGraph(follow_vehicle);
});
