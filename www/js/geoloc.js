var geoiter = 0;
//Geolocation html5
function showpunto(x1, y1) {
    logp("Ubica el punto:" + x1 + ", " + y1);
    miubicacion.removeAllFeatures();
    miubicacion.addFeatures([
        new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(x1, y1), {}, {
            externalGraphic: 'images/ic_ubic-web.png', 
            graphicHeight: 24, graphicWidth: 24
        })]);
    logp("Centra el punto");
    map.zoomToExtent(miubicacion.getDataExtent());
    $.mobile.changePage("#manpage");
}

//function showpuntobusq(x1, y1) {
function showpuntobusq() {

    var layerBusqueda = map.getLayersByName("SearchBuildings2")[0];
    var b = layerBusqueda.getExtent();
    //        showpuntobusq(b.getCenterLonLat().lon, b.getCenterLonLat().lat);
    x1 = b.getCenterLonLat().lon;
    y1 = b.getCenterLonLat().lat;
    logp("Ubica el busqueda:" + x1 + ", " + y1);
    busquedaubicacion.removeAllFeatures();
    busquedaubicacion.addFeatures([
        new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(x1, y1), {}, {
            externalGraphic: 'images/ic_busq-web.png', graphicHeight: 24, graphicWidth: 24,
        })]);
    logp("Punto busqueda");
}

function showLocation(position) {

    logp("Limpiar Geolocation");
    navigator.geolocation.clearWatch(watchID);

    logp("Transforma EPSG:4326 a Spherical Mercator Projetion");
    var lonLat = new OpenLayers.LonLat(position.coords.longitude,
            position.coords.latitude).transform(
            new OpenLayers.Projection("EPSG:4326"), //transform from WGS 1984
            map.getProjectionObject() //to Spherical Mercator Projection
            );
    showpunto(lonLat.lon, lonLat.lat);
    geoiter = 0;
}

function showLocationInicial(position) {

    logp("Limpiar Geolocation");
    navigator.geolocation.clearWatch(watchID);

    logp("Transforma EPSG:4326 a Spherical Mercator Projetion");
    var lonLat = new OpenLayers.LonLat(position.coords.longitude,
            position.coords.latitude).transform(
            new OpenLayers.Projection("EPSG:4326"), //transform from WGS 1984
            map.getProjectionObject() //to Spherical Mercator Projection
            );
    showpunto(lonLat.lon, lonLat.lat);
    map.zoomTo(7);
}

function onError(error) {
    getLocationUpdate();
    /*
     alert('code: ' + error.code + '\n' +
     'message: ' + error.message + '\n');
     */
}

function getLocationUpdate() {
    //alert('inicia');
    logp("Watch Position");
    switch (geoiter) {
        case 0:
            watchID = navigator.geolocation.watchPosition(showLocation,
                    onError, {timeout: 3000, enableHighAccuracy: true});
            geoiter = geoiter + 1;
            break;
        case 1:
            watchID = navigator.geolocation.watchPosition(showLocation,
                    onError, {timeout: 2000, enableHighAccuracy: false});
            geoiter = geoiter + 1;
            break;
        case 2:
            watchID = navigator.geolocation.getCurrentPosition(showLocation,
                    onError,
                    {timeout: 1000, enableHighAccuracy: true});
            geoiter = geoiter + 1;
            break;
        case 3:
            watchID = navigator.geolocation.getCurrentPosition(showLocation,
                    onError,
                    {timeout: 1000});
            geoiter = geoiter + 1;
            break;
        default:
            geoiter = 0;
            console.log("sin ubicacion");
            //alert('Ubicación no disponible');
    }

    //alert('enviado');
}

function getLocationInicial() {
    //alert('inicia');
    logp("Watch Position");
    /*
     watchID = navigator.geolocation.watchPosition(showLocationInicial, onError, {timeout: 31000, enableHighAccuracy: true});
     */
    getLocationUpdate();
    /*
    watchID = navigator.geolocation.getCurrentPosition(showLocation,
            onError,
            {timeout: 31000});
            */
    //alert('enviado');
}
//Geolocation html5
