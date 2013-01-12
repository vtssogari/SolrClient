/**
 * User: kek4
 * Date: 6/18/12
 * Time: 1:53 PM
 * To change this template use File | Settings | File Templates.
 */

///<reference path="jquery.d.ts" />
///<reference path="jqueryui.d.ts" />
///<reference path="bootstrap-2.1.d.ts" />
///<reference path='SolrJS.ts' />
///<reference path='Configuration.ts' />


// 1. Initial Setting ----------------------------------------------------

var solrjs:solr.Solr = new solr.Solr();

$(document).ready(() => {
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

function postRender(): void {
    for (var i: number = 0; i < solr.Configuration.fields.length; i++) {
        var field: solr.Field = solr.Configuration.fields[i];

        // 1. Add autocomplete support
        $("#"+ field.name).standardAutocomplete(solr.Configuration.host + "&q="+field.name+":qValue*&rows=0&facet=true&facet.field=" + field.autocomplete + "&facet.mincount=1", field.autocomplete);
    }
}


// 2. Rendering ---------------------------------------------------------------

function renderPage(data): void {
    // Render the primary response, associated results and facets
    var bstring:string = $("#breadcrumbs").render(solrjs.params); 
    $('#breadcrumbCon').html(bstring);
    //var searchString:string = $("#searchTmpl").render({ query: solrjs.q });
    //$('#rightCon').html(searchString);
    var pstring:string = $("#pagenationTmpl").render(data);
    $('#rightCon').html(pstring);
    $('#rightCon').append($('#resultTmpl').render(data));
    $('#rightCon').append(pstring);
    var timeTookStr = $('#timeBench').render(data);
    $('#searchTime').html(timeTookStr);
    $("#loading").hide();
}

// 3. Query -------------------------------------------------------------------

function query(q:string) :void {
    // Search request
    var queryString = (q !== undefined && q !== '' ? q : '*:*');
    solrjs.q(queryString);
    _request();
    $('#home').html('');
}

function _request() :void {
    solrjs.request();
    $("#loading").show();
}

// 4. Page Action ----------------------------------------------------------------
function replaceSpecialCharacter(text:string) :string{
    var result:string = '';
    if(text){
        var cleanedWord = text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "");
        if(cleanedWord != 'AND' && cleanedWord != 'OR'){
            result = cleanedWord;
        }
    }
    return result;
}

// 5. Filter Related -------------------------------------------------------------

function addFilter(field: string, value: string): void {
    solrjs.add_bq(field, value);
    _request();
}

function removeFilter(field: string, value: string): void {
    solrjs.remove_bq(field, value);
    _request();
}

// 6. Sorting Related ------------------------------------------------------------


// 7. Pagenation Related ---------------------------------------------------------

function first(): void{
    solrjs.pagination.firstPage();
    _request();
}
function last(): void {
    solrjs.pagination.lastPage();
    _request();
}
function next(): void {
    solrjs.pagination.nextPage();
    _request();
}
function prev(): void {
    solrjs.pagination.prevPage();
    _request();
}
function page(pageNumber:number): void {
    solrjs.pagination.page(pageNumber - 1);
    _request();
}

// 8. Pages Per View -------------------------------------------------------------

function rowsBy(rows): void{
    solrjs.rows(rows);
    _request();
}

