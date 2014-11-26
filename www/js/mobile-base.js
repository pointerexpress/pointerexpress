// API key for http://openlayers.org. Please get your own at
// http://bingmapsportal.com/ and use that instead.

// initialize map when page ready
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
var map;
var gg = new OpenLayers.Projection("EPSG:4326");
var sm = new OpenLayers.Projection("EPSG:900913");
var apiKey = "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf";
var popup;
var s2 = s2 || {};

var vectorMap = new OpenLayers.StyleMap({
    'fillOpacity': 0,
    'strokeWidth': 2,
    'strokeColor': '#7cc4e7'
});
var lsearch2Map = new OpenLayers.StyleMap({
    'fillColor': '#7cc4e7',
    'strokeWidth': 1,
    'strokeColor': '#00ffff'
});
var lsearchwfsMap = new OpenLayers.StyleMap({
    'fillColor': '#7cc4e7',
    'strokeWidth': 1,
    'strokeColor': '#00ffff'
});

var vector = new OpenLayers.Layer.Vector("SearchBuildings", {styleMap: vectorMap});
var lsearch2 = new OpenLayers.Layer.Vector("SearchBuildings2", {});
var lsearchwfs = new OpenLayers.Layer.Vector("SearchWFS", {});

var miubicacion = new OpenLayers.Layer.Vector("MiPointer", {});
var busquedaubicacion = new OpenLayers.Layer.Vector("LaBusqueda", {});
var selectShape;
var watchId;

OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },
    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend(
                {}, this.defaultHandlerOptions
                );
        OpenLayers.Control.prototype.initialize.apply(
                this, arguments
                );
        this.handler = new OpenLayers.Handler.Click(
                this, {
                    'click': this.trigger
                }, this.handlerOptions
                );
    },
    trigger: function(e) {

        var opx = map.getLayerPxFromViewPortPx(e.xy);
        var lonlat = map.getLonLatFromPixel(e.xy);
        var lonlatclone = lonlat.clone();
        lonlatclone.transform(map.getProjectionObject(), new OpenLayers.Projection('EPSG:' + s2.config.dataSrid))

        $("#cabeceraseleccion .ui-btn-text").text("Localizando...");
        $("#datoseleccion").html("&nbsp;");
        //vector.removeAllFeatures();
        $.mobile.loading('show');

        try {
            map.removePopup(popup);
            popup.destroy();
            popup = null;
        } catch (e) {
            s2.log("");
        }

        Server._path = pathToDwrServlet;
        Server.search('POINT(' + lonlatclone.lon + ' ' + lonlatclone.lat + ')', s2.config.dataSrid, 'point', null, 'public', function(results) {
            if (results.buildings.length > 0) {
                $.getJSON(pathBaseServlet + "geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature"
                        + "&srsName="
                        + map.getProjection()
                        + "&outputFormat=JSON"
                        + "&typeName="
                        + 'S2:DAD_Buildings'
                        + '&CQL_FILTER=Dad_BuildingID in (' + results.buildings[0].id + ')',
                        function(data) {
                            geojsonParser = new OpenLayers.Format.GeoJSON();
                            var _layer = vector;
                            var nuevasFeatures = geojsonParser.read(data);
                            var lines = new Array();
                            var resultLines = nuevasFeatures[0].data.InterfazAddress.split('<br/>');
                            for (var l in resultLines) {
                                var line = resultLines[l];
                                if (line.indexOf('<') == -1 && line.indexOf(':') > 0) {
                                    line = $.i18n.prop(line.substring(0, line.indexOf(':'))) + line.substring(line.indexOf(':'));
                                }
                                lines.push(line);
                            }

                            $('#hoverHeader').removeClass("searchsel");
                            $('#hoverHeader').addClass("clicksel");

                            var pointer=lines[0];
                
                            $('#hoverPointer').html(lines.shift());
                            var linesHtml = '<div>' + lines.join('</div><div>') + '</div>';
                            $('#hoverDetail').html(linesHtml);

                            //$('#popupUbicacion').fadeIn();

                            //$("#popupUbicacion").popup("open", {positionTo: '#mensajenav'});

                            _layer.removeAllFeatures();
                            _layer.addFeatures(nuevasFeatures);
                            $.mobile.hidePageLoadingMsg();
                                            
                            $('#hresultado').removeClass("searchdiv");
                            $('#hresultado').addClass("clickdiv");

                            mensajeSeleccion(pointer, linesHtml);
                            
                            limpiabusquedamap;

                        });
            } else {
                $("#cabeceraseleccion .ui-btn-text").text("No seleccionado");
                $("#datoseleccion").html("&nbsp;");
                $.mobile.hidePageLoadingMsg();
                _layer = vector;
                _layer.removeAllFeatures();
                $('#notimsg').html("No encontrado.")
                $('#notimsg').fadeIn(2000).delay(1000).fadeOut(2000);
            }
            $.mobile.changePage("#manpage");

        });
    }

});

s2.log = function(obj) {
    if (window.console && window.console.log)
        window.console.log(obj);
};

// Start the map initialization process
function inicial() {
    json_text = configbase();
    s2.config = json_text;
    inicializa();
    initLayerList();
    $("#grupobt").hide();
}

function inicializa() {

    OpenLayers.DOTS_PER_INCH = 90.71428571428572;
    OpenLayers.Util.onImageLoadErrorColor = 'transparent';

    var initialBounds = new OpenLayers.Bounds(s2.config.maxBounds.minX,
            s2.config.maxBounds.minY, s2.config.maxBounds.maxX,
            s2.config.maxBounds.maxY);
    var initialProjection = new OpenLayers.Projection(s2.config.maxBounds.srs);
    //var dataProjection = new OpenLayers.Projection('EPSG:' + s2.config.dataSrid);
    s2.config.useResolutions = [];
    for (var r = s2.config.minZoom; r <= s2.config.maxZoom; r++)
        s2.config.useResolutions.unshift(s2.config.resolutions[r]);
    s2.config.maxHoverZoom -= s2.config.minZoom;

    selectShape = new OpenLayers.Layer.Vector("Seleccionado");


    var geolocate = new OpenLayers.Control.Geolocate({
        id: 'locate-control',
        geolocationOptions: {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 7000
        }
    });
    // create map
    s2.config.baseMapXYZURL = pathBaseServlet + "geoserver/gwc/service/gmaps?layers=S2BaseMapMovil&zoom=${z}&x=${x}&y=${y}&FORMAT=image%2Fjpeg";
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        units: s2.config.units,
        projection: s2.config.mapSrs,
        numZoomLevels: 18,
        controls: [new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
           //new OpenLayers.Control.Zoom(),
            geolocate, ],
        layers: [
            //  new OpenLayers.Layer.OSM("OpenStreetMap", null, { transitionEffect : 'resize' }),
            new OpenLayers.Layer.OSM("BaseMap", s2.config.baseMapXYZURL, {
                serverResolutions: s2.config.resolutions,
                resolutions: s2.config.useResolutions,
                visibility: true,
                isBaseLayer: true,
                transitionEffect: 'resize'
            }), vector, lsearch2, lsearchwfs, miubicacion, selectShape, busquedaubicacion],
        center: new OpenLayers.LonLat(0, 0),
        zoom: 1
    });

    s2.initialExtents = initialBounds.clone().transform(initialProjection,
            map.getProjectionObject());
    map.zoomToExtent(s2.initialExtents, false);


    var click = new OpenLayers.Control.Click();
    map.addControl(click);
    click.activate();

    var style = {
        fillOpacity: 0.1,
        fillColor: '#000',
        strokeColor: '#f00',
        strokeOpacity: 0.6
    };
    /*
     geolocate.events.register("locationupdated", this, function(e) {
     //getLocationUpdate();
     
     vector.removeAllFeatures();
     vector.addFeatures([
     new OpenLayers.Feature.Vector(e.point, {}, {
     externalGraphic: 'images/ic_ubic-web.png', graphicHeight: 40, graphicWidth: 40,
     })	
     ,
     new OpenLayers.Feature.Vector(OpenLayers.Geometry.Polygon
     .createRegularPolygon(new OpenLayers.Geometry.Point(
     e.point.x, e.point.y),
     e.position.coords.accuracy / 2, 50, 0), {},
     style) ]);
     map.zoomToExtent(vector.getDataExtent());
     });
     */
    s2.sldStyles = {};
    s2.sldFormat = new OpenLayers.Format.SLD({
        multipleSymbolizers: true,
        namedLayersAsArray: true
    });

    s2.setWFSLayer = function(name, layerName, filter, defaultStyle, selectedStyle) {
        var layer = map.getLayersByName(name)[0];

        if (layer)
            layer.setVisibility(false);

        console.log("setWFSLayer: " + name);

        if (filter) {
            var protocol = new OpenLayers.Protocol.HTTP(
                    {
                        url: pathBaseServlet + "geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature"
                                + "&srsName="
                                + map.getProjection()
                                + "&outputFormat=JSON"
                                + "&typeName="
                                + layerName + filter,
                        format: new OpenLayers.Format.GeoJSON(),
                        wmsParams: {
                            layer: layerName,
                            filter: filter,
                            style: defaultStyle,
                            selectedStyle: selectedStyle
                        },
                        attribution:"Pointer Express"
                    });

            console.log("Layer setWFSLayer: " + layer.name);
            console.log("Protocol setWFSLayer: " + protocol.url);

            if (layer) {
                //layer.protocol = protocol;
                //layer.strategies= [new OpenLayers.Strategy.Fixed()];
                map.removeLayer(layer);
            } //else {
            layer = new OpenLayers.Layer.Vector(
                    name,
                    {
                        strategies: [new OpenLayers.Strategy.Fixed()],
                        projection: map.getProjection(),
                        protocol: protocol
                    });
            map.addLayer(layer);
            layer.redraw();
            layer.events.register("loadend", layer, function() {
               showpuntobusq();
            });
            //}
        }
    };

    s2.loadStyle = function(styleName) {
        if (!s2.sldStyles[styleName]) {
            OpenLayers.Request.GET({
                url: pathBaseServlet + 'geoserver/rest/styles/' + styleName + '.sld',
                async: false,
                success: function(req) {
                    s2.sldStyles[styleName] = s2.sldFormat.read(req.responseXML || req.responseText);
                }
            });
        }
        return s2.sldStyles[styleName];
    };

    s2.searchResults = function(results) {
        s2.results = results;

        // Clear prior search
        var _layer = lsearch2;
        _layer.removeAllFeatures();

        // Highlight Buildings on map
        if (results.buildings.length) {
            var bs = '';
            for (var b in results.buildings) {
                if (bs != '')
                    bs += ',';
                bs += results.buildings[b].id;
            }
            s2.setWFSLayer('SearchBuildings2', 'S2:DAD_Buildings', bs ? '&CQL_FILTER=Dad_BuildingID in (' + bs + ')' : null, 'S2_HighlightPolygon', 'S2_SelectedPolygon');
        }
    }

    s2.selectResults = function(type, id, results) {
        s2.results = results;

        s2.searchResults(results);

        if (type == 'Roads') {
            s2.setWFSLayer('SearchWFS', 'S2:DAD_Roads', '&CQL_FILTER=Dad_RoadSegmentID in (' + results.subIds.join(',') + ')', 'S2_HighlightLine');
        }
        else if (type == "Barrio") {
            var ids = id.split('.');
            s2.setWFSLayer('SearchWFS', 'S2:DAD_' + type, "&CQL_FILTER=DAD_BarrioID eq '" + ids[0] + "' and DAD_CorregID eq '" + ids[1] + "'", 'S2_HighlightPolygon');
        }

        if (results.zoomToBounds) {
            var ext = new OpenLayers.Bounds(results.zoomToBounds.minX, results.zoomToBounds.minY, results.zoomToBounds.maxX, results.zoomToBounds.maxY);
            var prj = new OpenLayers.Projection(results.zoomToBounds.srs);

            ext.transform(prj, map.getProjectionObject());
            map.zoomToExtent(ext);
        }
    };
}
;
