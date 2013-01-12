var solr;
(function (solr) {
    var Result = (function () {
        function Result() {
            this.viewsPerPageOptions = solr.Configuration.viewsPerPageOptions;
            this.fields = [];
        }
        return Result;
    })();
    solr.Result = Result;    
    var Solr = (function () {
        function Solr() {
            this.params = new Params();
            this.pagination = new Pagenation();
        }
        Solr.prototype.request = function () {
            var _this = this;
            $.publish("/solr/show/progress", null);
            var requestTime = new Date();
            $.ajax(this.url(), {
                dataType: 'jsonp',
                jsonp: 'json.wrf',
                success: function (data) {
                    _this.response = data.response;
                    _this.pagination.response = data.response;
                    _this.pagination.params = _this.params;
                    var result = new Result();
                    result.response = data.response;
                    result.pagenation = _this.pagination.getPagenationModel();
                    result.queryTime = (data.responseHeader.QTime / 1000).toFixed(2);
                    result.totalTime = _this.timeDiff(requestTime, new Date());
                    result.fields = solr.Configuration.fields;
                    $.publish("/solr/relevancy/data", [
                        result
                    ]);
                    $.publish("/solr/hide/progress", null);
                }
            });
        };
        Solr.prototype.timeDiff = function (earlierDate, laterDate) {
            return ((laterDate.getTime() - earlierDate.getTime()) / 1000).toFixed(2);
        };
        Solr.prototype.q = function (query) {
            if(query !== undefined) {
                this.params.q = query;
            } else {
                return this.params.q;
            }
        };
        Solr.prototype.rows = function (rowNum) {
            if(rowNum !== undefined) {
                this.params.rows = parseInt(rowNum);
                var size;
                for(var i = 0; i < solr.Configuration.viewsPerPageOptions.length; i++) {
                    var conf = solr.Configuration.viewsPerPageOptions[i];
                    if(conf.name === rowNum) {
                        conf.selected = true;
                    } else {
                        conf.selected = false;
                    }
                }
            } else {
                return this.params.rows;
            }
        };
        Solr.prototype.add_bq = function (field, value) {
            var i, fq;
            for(i = 0; i < this.params.fq.length; i++) {
                fq = this.params.fq[i];
                if(fq) {
                    if(fq.field === field && fq.value === value) {
                        return;
                    }
                }
            }
            var newFq = new FilterQuery(field, value);
            this.params.fq.push(newFq);
            this.resetPagnation();
        };
        Solr.prototype.remove_bq = function (field, value) {
            for(var i = 0; i < this.params.fq.length; i++) {
                if(this.params.fq[i] !== undefined && this.params.fq[i].field === field && this.params.fq[i].value === value) {
                    this.params.fq.splice(i, 1);
                    this.resetPagnation();
                    return this.params.fq.length;
                }
            }
            return 0;
        };
        Solr.prototype.reset_bq = function () {
            this.params.fq = new Array();
        };
        Solr.prototype._url = function () {
            if(this.querySyntaxContains(this.params.q)) {
                var query = this.params.q;
                if(this.querySyntaxContainsAndOr(this.params.q)) {
                    query = this.params.q.replace(/ and /gi, " AND ");
                    query = query.replace(/ or /gi, " OR ");
                }
                this.params.q = query;
            } else {
                query = this.escape(this.params.q);
            }
            var req = solr.Configuration.host + '&q=' + query;
            for(var i = 0; i < this.params.fq.length; i++) {
                if(this.params.fq[i] !== undefined) {
                    req += '&fq=' + this.params.fq[i].field + ':(' + this.params.fq[i].value + ')';
                }
            }
            return req;
        };
        Solr.prototype.querySyntaxContains = function (queryString) {
            if(queryString) {
                return ((queryString.indexOf("*") > -1) || this.querySyntaxContainsAndOr(queryString) || (queryString.indexOf('"') > -1) || (queryString.indexOf('~') > -1) || (queryString.indexOf('^') > -1));
            }
            return false;
        };
        Solr.prototype.querySyntaxContainsAndOr = function (queryString) {
            if(queryString) {
                return ((queryString.toLowerCase().indexOf("and") > -1) || (queryString.toLowerCase().indexOf("or") > -1));
            }
            return false;
        };
        Solr.prototype.url = function () {
            var req = this._url();
            req += '&start=' + this.params.start;
            req += '&rows=' + this.params.rows;
            return req;
        };
        Solr.prototype.reset = function () {
            this.params = new Params();
            this.response = null;
        };
        Solr.prototype.resetPagnation = function () {
            this.params.start = 0;
            this.params.rows = 10;
            this.response = null;
        };
        Solr.prototype.getPagenationModel = function (numFound) {
            this.pagination.page(numFound);
            return this.pagination.getPagenationModel();
        };
        Solr.prototype.escape = function (query) {
            var newString = '', counter = 0, i = 0, chr = '';
            if(query && query !== null) {
                counter = query.length;
                for(i = 0; i < counter; i++) {
                    chr = query.substring(i, i + 1);
                    if(chr === '+' || chr === '-' || chr === '!' || chr === '(' || chr === ')' || chr === '{' || chr === '}' || chr === '[' || chr === ']' || chr === '^' || chr === '"' || chr === '~' || chr === '*' || chr === '?' || chr === ':' || chr === "\\") {
                        newString += "\\" + chr;
                    } else {
                        newString += chr;
                    }
                }
            }
            return newString;
        };
        return Solr;
    })();
    solr.Solr = Solr;    
    var FilterQuery = (function () {
        function FilterQuery(field, value) {
            this.field = field;
            this.value = value;
        }
        return FilterQuery;
    })();
    solr.FilterQuery = FilterQuery;    
    var Params = (function () {
        function Params() {
            this.q = "";
            this.fq = [];
            this.start = 0;
            this.rows = 10;
        }
        return Params;
    })();
    solr.Params = Params;    
    var Pagenation = (function () {
        function Pagenation() {
            this.p = 0;
            this.response = null;
            this.params = null;
        }
        Pagenation.prototype.pageNumbers = function () {
            var pageNumbers;
            var startPage = (this.p) - (this.p % 4);
            var endPage = startPage + 4;
            var t = this.totalPage();
            if(endPage > t) {
                endPage = t;
            }
            pageNumbers = [];
            for(var i = startPage; i < endPage; i++) {
                if(i === this.p) {
                    pageNumbers.push({
                        selected: true,
                        pageNumber: (i + 1)
                    });
                } else {
                    pageNumbers.push({
                        selected: false,
                        pageNumber: (i + 1)
                    });
                }
            }
            return pageNumbers;
        };
        Pagenation.prototype.totalPage = function () {
            return Math.floor(this.response.numFound / this.params.rows) + ((this.response.numFound % this.params.rows) > 0 ? 1 : 0);
        };
        Pagenation.prototype.page = function (pageNumber) {
            if(pageNumber !== undefined && pageNumber !== null) {
                if(this.canPage(pageNumber)) {
                    this.p = pageNumber;
                    this.params.start = (this.p) * this.params.rows;
                }
            } else {
                return this.p;
            }
        };
        Pagenation.prototype.nextPage = function () {
            return this.page(this.p + 1);
        };
        Pagenation.prototype.prevPage = function () {
            return this.page(this.p - 1);
        };
        Pagenation.prototype.firstPage = function () {
            return this.page(0);
        };
        Pagenation.prototype.lastPage = function () {
            return this.page(this.totalPage() - 1);
        };
        Pagenation.prototype.canPage = function (pageNumber) {
            var s = (pageNumber) * this.params.rows;
            return (s > -1 && s < this.response.numFound);
        };
        Pagenation.prototype.canNextPage = function () {
            return (this.canPage(this.p + 1));
        };
        Pagenation.prototype.canPrevPage = function () {
            return (this.canPage(this.p - 1));
        };
        Pagenation.prototype.canFirstPage = function () {
            return ((this.response.numFound > 0) && (this.p > 0));
        };
        Pagenation.prototype.canLastPage = function () {
            return ((this.response.numFound > 0) && (this.p < this.totalPage() - 1));
        };
        Pagenation.prototype.showPagenatedNumber = function () {
            return true;
        };
        Pagenation.prototype.getPagenationModel = function () {
            return {
                numFound: this.response.numFound,
                selectedPage: this.p + 1,
                totalPages: this.totalPage(),
                canFirstPage: this.canFirstPage(),
                canLastPage: this.canLastPage(),
                canNextPage: this.canNextPage(),
                canPrevPage: this.canPrevPage(),
                pageNumbers: this.pageNumbers(),
                showPagenatedNumber: this.showPagenatedNumber()
            };
        };
        return Pagenation;
    })();
    solr.Pagenation = Pagenation;    
})(solr || (solr = {}));
//@ sourceMappingURL=SolrJs.js.map
