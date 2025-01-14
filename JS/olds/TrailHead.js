(function ($) {

    $.fn.storymap = function (options) {

        var settings = $.extend(defaults, options);

        if (typeof(L) === 'undefined') {
            throw new Error('Storymap requires Laeaflet');
        }
        if (typeof(_) === 'undefined') {
            throw new Error('Storymap requires underscore.js');
        }

        function getDistanceToTop(elem, top) {
            var docViewTop = $(window).scrollTop();

            var elemTop = $(elem).offset().top;

            var dist = elemTop - docViewTop;

            var d1 = top - dist;

            if (d1 < 0) {
                return $(document).height();
            }
            return d1;
        }


        function highlightTopPara(paragraphs, top) {

            var distances = _.map(paragraphs, function (element) {
                var dist = getDistanceToTop(element, top);
                return {el: $(element), distance: dist};
            });

            var closest = _.min(distances, function (dist) {
                return dist.distance;
            });

            _.each(paragraphs, function (element) {
                var paragraph = $(element);
                if (paragraph[0] !== closest.el[0]) {
                    paragraph.trigger('notviewing');
                }
            });

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }

        function watchHighlight(element, searchfor, top) {
            var paragraphs = element.find(searchfor);
            highlightTopPara(paragraphs, top);
            $(window).scroll(function () {
                highlightTopPara(paragraphs, top);
            });
        }

        var makeStoryMap = function (element, markers) {

            var topElem = $('<div class="breakpoint-current"></div>')
                .css('top', settings.breakpointPos);
            $('body').append(topElem);

            var top = topElem.offset().top - $(window).scrollTop();

            var searchfor = settings.selector;

            var paragraphs = element.find(searchfor);

            paragraphs.on('viewing', function () {
                $(this).addClass('viewing');
            });

            paragraphs.on('notviewing', function () {
                $(this).removeClass('viewing');
            });

            watchHighlight(element, searchfor, top);

            var map = settings.createMap();

            var initPoint = map.getCenter();

            var initZoom = map.getZoom();

            var fg = L.featureGroup().addTo(map);

            var popup = L.popup();

            var greenIcon = L.icon({
                iconUrl: '../images/hiker.png',

                iconSize:     [35, 35], // size of the icon
                iconAnchor:   [20, 20], // point of the icon which will correspond to marker's location
                popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            });



            function onMapClick(e) {
                popup
                    .setLatLng(e.latlng)
                    .setContent(e.latlng.toString())
                    .openOn(map);
            }

            map.on('click', onMapClick);

            L.control.scale().addTo(map);


            function showMapView(key) {

                fg.clearLayers();
                if (key === 'overview') {
                    map.setView(initPoint, initZoom, true);
                } else if (markers[key]) {
                    var marker = markers[key];
                    var layer = marker.layer;
                    if (typeof layer !== 'undefined') {
                        fg.addLayer(layer);
                    }
                    fg.addLayer(L.marker([marker.lat, marker.lon], {icon: greenIcon}));

                    map.setView([marker.lat, marker.lon - 0.005], marker.zoom, 1);
                }
            }

            paragraphs.on('viewing', function () {
                showMapView($(this).data('place'));
            });

        };

        makeStoryMap(this, settings.markers);

        return this;
    }

}(jQuery));
