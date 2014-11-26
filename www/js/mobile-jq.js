
// Start with the map page
window.location.replace(window.location.href.split("#")[0] + "#mappage");
var selectedFeature = null;
var platf = "Otro";
var devplat='Android';
function doClose() {
    $('#popupUbicacion').fadeOut();
}

function getDeviceProperty()
{
    try {
        platf = device.platform;
    } catch (e) {
        platf = e;
    }

    if (platf === "Android") {
        $("#salirapp").show();
    }

}

function salida() {
    if (navigator.app) {
        navigator.app.exitApp();
    } else if (navigator.device) {
        navigator.device.exitApp();
    }
}

$(document).ready(function() {
    $("#salirapp").hide();
    document.addEventListener("deviceready", getDeviceProperty, false);
    //getDeviceProperty();

    $("#salirapp").click(function() {
        salida();
    });

    $('#popupUbicacion-screen').click(function() {
        $.mobile.changePage("#manpage");
        logp("popup manpage");
    });

    document.addEventListener("backbutton", function(e) {
        if ($.mobile.activePage.is('#mappage')) {
            e.preventDefault();
            navigator.app.exitApp();
        } else {
            navigator.app.backHistory();
        }
    }, false);
    inicial();
    function fixContentHeight() {
        var footer = $("div[data-role='footer']:visible"),
                header = $("div[data-role='header']:visible"),
                content = $("div[data-role='content']:visible:visible"),
                viewHeight = $(window).height(),
                contentHeight = viewHeight - (footer.outerHeight() + header.outerHeight());
        if ((content.outerHeight() + footer.outerHeight() + header.outerHeight()) !== viewHeight) {
            contentHeight -= (content.outerHeight() - content.height() + 1);
            content.height(contentHeight);
        }

        if (window.map && window.map instanceof OpenLayers.Map) {
            map.updateSize();
        } else {
            initLayerList();
        }
    }
    $(window).bind("orientationchange resize pageshow", fixContentHeight);
    document.body.onload = fixContentHeight;
    // Map zoom  
    $("#plus").click(function() {
        map.zoomIn();
    });
    $("#minus").click(function() {
        map.zoomOut();
    });
    $("#locate").click(function() {
        /* var control = map.getControlsBy("id", "locate-control")[0];
         if (control.active) {
         control.getCurrentLocation();
         } else {
         control.activate();
         }*/
        getLocationUpdate();
    });
    $("#bextender").click(function() {
        $("#grupobt").hide();
        extender(true, true, true);
        $.mobile.changePage("#manpage");
    });
    $("#blimpiar").click(function() {
        $("#grupobt").hide();
        limpiabusquedamap();
        $.mobile.changePage("#manpage");
    });
/*
    $("#optbt").click(function() {
        $.mobile.changePage("#logpage");
        caracteristicas();
    });
*/

    $("#logbt").click(function() {
//$.mobile.changePage("#logpage");
//caracteristicas();
        $("#grupobt").toggle();
    });
    $("#searchbt").click(function() {
        $("#grupobt").hide();
        $.mobile.changePage("#searchpage");
        $('#query').focus();
    });
    $("#resultado").click(function() {
        $("#resultado").fadeOut("slow", function() {
            mensajeLimpia();
        });
    });
    $('#popup').live('pageshow', function(event, ui) {
        var li = "";
        for (var attr in selectedFeature.attributes) {
            li += "<li><div style='width:25%;float:left'>" + attr + "</div><div style='width:75%;float:right'>"
                    + selectedFeature.attributes[attr] + "</div></li>";
        }
        $("ul#details-list").empty().append(li).listview("refresh");
    });
    $('#searchType').change(function() {
        $('#search_results').empty();
        $('#query').val('')
        $('#query').focus();
    });
    $('#searchpage').live('pageshow', function(event, ui) {
        $('#query').bind('keyup', function(e) {
            delay(function() {

                $('#search_results').empty();
                if ($('#query')[0].value === '') {
                    return;
                }
                $.mobile.loading('show');
                // Prevent form send
                e.preventDefault();
                Server._path = pathToDwrServlet;
                stype = $('#searchType').val();
                qvalor = $('#query')[0].value;
                console.log('Buscando ' + stype + ': ' + qvalor);
                logp('Buscando ' + stype + ': ' + qvalor);
                Server.suggest(stype, qvalor, function(results) {
                    $.each(results, function() {
                        var place = this;
                        $('<li>').hide()
                                .append($('<h2 />', {
                                    text: place.label
                                })).appendTo('#search_results')
                                .click(function() {

                                    $.mobile.changePage('#mappage');
                                    //vector.removeAllFeatures();
                                    limpiabusquedamap;
                                    try {
                                        map.removePopup(popup);
                                        popup.destroy();
                                        popup = null;
                                    } catch (e) {
                                        s2.log("");
                                    }
                                    Server.select(place.type, place.id, null, 'public', function(results) {
                                        s2.selectResults(place.type, place.id, results);
                                        if (place.type == 'Address' ||
                                                place.type == 'Building' ||
                                                place.type == 'Business' ||
                                                place.type == 'Pointer' ||
                                                place.type == 'RUC') {
                                            buscaDescripcion(place.id);
                                        }
                                    });
                                }).show();
                    });
                    $('#search_results').listview('refresh');
                    $.mobile.changePage("#manpage");
                    $.mobile.hidePageLoadingMsg();
                });
            }, 1000);
        });
        // only listen to the first event triggered
        $('#searchpage').die('pageshow', arguments.callee);
    });
   getLocationInicial();
});
var delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();
function initLayerList() {
    $('#layerspage').page();
    var baseLayers = map.getLayersBy("isBaseLayer", true);
    $('<li>', {
        "data-role": "list-divider",
        text: "Capas base"
    }).appendTo('#layerslist');
    $.each(baseLayers, function() {
        addLayerToList(this);
    });
    $('<li>', {
        "data-role": "list-divider",
        text: "Capas adicionales"
    }).appendTo('#layerslist');
    var overlayLayers = map.getLayersBy("isBaseLayer", false);
    $.each(overlayLayers, function() {
        addLayerToList(this);
    });
    $('#layerslist').listview('refresh');
    map.events.register("addlayer", this, function(e) {
        addLayerToList(e.layer);
    });
}

function addLayerToList(layer) {
    var item = $('<li>', {
        "data-icon": "check",
        "class": layer.visibility ? "checked" : ""
    })
            .append($('<a />', {
                text: layer.name
            })
                    .click(function() {
                        $.mobile.changePage('#mappage');
                        if (layer.isBaseLayer) {
                            layer.map.setBaseLayer(layer);
                        } else {
                            layer.setVisibility(!layer.getVisibility());
                        }
                    })
                    )
            .appendTo('#layerslist');
    layer.events.on({
        'visibilitychanged': function() {
            $(item).toggleClass('checked');
        }
    });
}

function buscaDescripcion(pBID) {
    $.getJSON(pathBaseServlet + "geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature"
            + "&srsName="
            + map.getProjection()
            + "&outputFormat=JSON"
            + "&typeName="
            + 'S2:DAD_Buildings'
            + '&CQL_FILTER=Dad_BuildingID in (' + pBID + ')',
            function(data) {
                geojsonParser = new OpenLayers.Format.GeoJSON();
                var _layer = vector;
                var nuevasFeatures = geojsonParser.read(data);
                var centro = nuevasFeatures[0].geometry.getBounds().getCenterLonLat();
                var lines = new Array();
                var resultLines = nuevasFeatures[0].data.InterfazAddress.split('<br/>');
                for (var l in resultLines) {
                    var line = resultLines[l];
                    if (line.indexOf('<') == -1 && line.indexOf(':') > 0) {
                        line = $.i18n.prop(line.substring(0, line.indexOf(':'))) + line.substring(line.indexOf(':'));
                    }
                    lines.push(line);
                }
                var pointer = lines[0];
                $('#hoverHeader').removeClass("clicksel");
                $('#hoverHeader').addClass("searchsel");
                $('#hoverPointer').html(lines.shift());
                var linesHtml = '<div>' + lines.join('</div><div>') + '</div>';
                $('#hoverDetail').html(linesHtml);
                //      $('#popupUbicacion').fadeIn();
                //      $("#popupUbicacion").popup("open", {positionTo: '#mensajenav'})

                $('#hresultado').removeClass("clickdiv");
                $('#hresultado').addClass("searchdiv");
                mensajeSeleccion(pointer, linesHtml);
                //_layer.addFeatures(nuevasFeatures);

                //var bounds = new OpenLayers.Bounds();
                //for (var x in _layer.features) {
                //     bounds.extend(_layer.features[x].geometry.getBounds());
                //}
                // map.zoomToExtent(bounds,true);
            });
}