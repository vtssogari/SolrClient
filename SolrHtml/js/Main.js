var solrjs = new solr.Solr();
$(document).ready(function () {
    $('.nav-tabs').button();
    $(".collapse").collapse();
    $.subscribe("/solr/relevancy/data", function (e, data) {
        renderPage(data);
        postRender();
    });
    $.subscribe("/solr/filter", function (e, data) {
        solrjs.reset_bq();
        addFilter(data.field, data.value);
    });
    query('');
});
function postRender() {
    for(var i = 0; i < solr.Configuration.fields.length; i++) {
        var field = solr.Configuration.fields[i];
        $("#" + field.name).standardAutocomplete(solr.Configuration.host + "&q=" + field.name + ":qValue*&rows=0&facet=true&facet.field=" + field.autocomplete + "&facet.mincount=1", field.autocomplete);
    }
}
function renderPage(data) {
    var bstring = $("#breadcrumbs").render(solrjs.params);
    $('#breadcrumbCon').html(bstring);
    var pstring = $("#pagenationTmpl").render(data);
    $('#rightCon').html(pstring);
    $('#rightCon').append($('#resultTmpl').render(data));
    $('#rightCon').append(pstring);
    var timeTookStr = $('#timeBench').render(data);
    $('#searchTime').html(timeTookStr);
    $("#loading").hide();
}
function query(q) {
    var queryString = (q !== undefined && q !== '' ? q : '*:*');
    solrjs.q(queryString);
    _request();
    $('#home').html('');
}
function _request() {
    solrjs.request();
    $("#loading").show();
}
function replaceSpecialCharacter(text) {
    var result = '';
    if(text) {
        var cleanedWord = text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "");
        if(cleanedWord != 'AND' && cleanedWord != 'OR') {
            result = cleanedWord;
        }
    }
    return result;
}
function addFilter(field, value) {
    solrjs.add_bq(field, value);
    _request();
}
function removeFilter(field, value) {
    solrjs.remove_bq(field, value);
    _request();
}
function first() {
    solrjs.pagination.firstPage();
    _request();
}
function last() {
    solrjs.pagination.lastPage();
    _request();
}
function next() {
    solrjs.pagination.nextPage();
    _request();
}
function prev() {
    solrjs.pagination.prevPage();
    _request();
}
function page(pageNumber) {
    solrjs.pagination.page(pageNumber - 1);
    _request();
}
function rowsBy(rows) {
    solrjs.rows(rows);
    _request();
}
//@ sourceMappingURL=Main.js.map
