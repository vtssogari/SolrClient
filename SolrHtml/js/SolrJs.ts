///<reference path="jquery.d.ts" />
///<reference path='Configuration.ts' />

// Module 
module solr {

    export class Result {
        public pagenation: PagenationModel;
        public queryTime: string;
        public totalTime: string;
        public response: IResponse;
        public viewsPerPageOptions: solr.ViewPerPages[] = Configuration.viewsPerPageOptions;
        public fields: solr.Field[] = [];
    }

    // Class
    export class Solr  {
        public params: Params = new Params();
        public response: IResponse;
        public pagination: Pagenation = new Pagenation();

        // Constructor
        constructor () { 
        
        }

        // Request----------------------------------

        public request(): void {
            $.publish("/solr/show/progress", null);
            var requestTime = new Date();
            $.ajax(this.url(),
                {
                    dataType: 'jsonp',
                    jsonp: 'json.wrf',
                    success: (data) => {
                        this.response = data.response;
                        this.pagination.response = data.response;
                        this.pagination.params = this.params;
                        var result: Result = new Result();
                        result.response = data.response;
                        result.pagenation = this.pagination.getPagenationModel();
                        result.queryTime = (data.responseHeader.QTime / 1000).toFixed(2);
                        result.totalTime = this.timeDiff(requestTime, new Date());
                        result.fields = Configuration.fields;
                        $.publish("/solr/relevancy/data", [result]);
                        $.publish("/solr/hide/progress", null);
                    }
                });
        }


        public timeDiff (earlierDate, laterDate): string {
            return ((laterDate.getTime() - earlierDate.getTime())/1000).toFixed(2);
        }
        
        // -----------------------------------------

        public q (query: string): string {
            if (query !== undefined) {
                this.params.q = query;
            } else {
                return this.params.q;
            }
        }

        public rows(rowNum: string) :number {
            if (rowNum !== undefined) {
                this.params.rows = parseInt(rowNum);
                var size: number;
                for (var i: number = 0; i < Configuration.viewsPerPageOptions.length; i++) {
                    var conf:solr.ViewPerPages = Configuration.viewsPerPageOptions[i];
                    if (conf.name === rowNum) {
                        conf.selected = true;
                    } else {
                        conf.selected = false;
                    }
                }
            } else {
                return this.params.rows;
            }
        }

        public add_bq(field :string, value:string) :void {
            var i, fq;
            for (i = 0; i < this.params.fq.length; i++) {
                fq = this.params.fq[i];
                if (fq) {
                    if (fq.field === field && fq.value === value) {
                        return;
                    }
                }
            }
            var newFq: FilterQuery = new FilterQuery(field, value);

            this.params.fq.push(newFq);
            this.resetPagnation();
        }

        public remove_bq (field:string, value:string) :number {
            for (var i: number = 0; i < this.params.fq.length; i++) {
                if (this.params.fq[i] !== undefined && this.params.fq[i].field === field && this.params.fq[i].value === value) {
                    this.params.fq.splice(i, 1);
                    this.resetPagnation();
                    return this.params.fq.length;
                }
            }
            return 0;
        }

        public reset_bq(): void {
            this.params.fq = new FilterQuery[];
        }

        private _url(): string {
            if (this.querySyntaxContains(this.params.q)) {
                var query: string = this.params.q;
                if (this.querySyntaxContainsAndOr(this.params.q)) {
                    query = this.params.q.replace(/ and /gi, " AND ");
                    query = query.replace(/ or /gi, " OR ");
                }
                this.params.q = query;
            } else {
                query = this.escape(this.params.q);  //Default to Proximity matching
            }

            var req: string = Configuration.host + '&q=' + query;
            for (var i: number = 0; i < this.params.fq.length; i++) {
                if (this.params.fq[i] !== undefined) {
                    req += '&fq=' + this.params.fq[i].field + ':(' + this.params.fq[i].value + ')';
                }
            }
            return req;
        }

        public querySyntaxContains(queryString: string): bool {
            if (queryString) {
                return ((queryString.indexOf("*") > -1)                   //wildcard search
                    || this.querySyntaxContainsAndOr(queryString)     //and or search
                    || (queryString.indexOf('"') > -1)      //exact search
                    || (queryString.indexOf('~') > -1)      //fuzzy search
                    || (queryString.indexOf('^') > -1)      //term boosting
                );
            }
            return false;
        }

        public querySyntaxContainsAndOr(queryString: string): bool {
            if (queryString) {
                return (
                    (queryString.toLowerCase().indexOf("and") > -1)    //and search
                    || (queryString.toLowerCase().indexOf("or") > -1)     //or search
                    );
            }
            return false;
        }


        public url ():string {
            var req:string = this._url();
            req += '&start=' + this.params.start;
            req += '&rows=' + this.params.rows;
            return req;
        }

        public reset(): void {
            this.params = new Params();
            this.response = null;
        }

        public resetPagnation ():void{
            this.params.start = 0;
            this.params.rows = 10;
            this.response = null;
        }

        public getPagenationModel (numFound:number) : PagenationModel {
            this.pagination.page(numFound);
            return this.pagination.getPagenationModel();
        }

        public escape (query:string):string {
            // + - && || ! ( ) { } [ ] ^ " ~ * ? : \

            var newString = '', counter = 0, i = 0, chr = '';
            if (query && query !== null) {
                counter = query.length;
                for (i = 0; i < counter; i++) {
                    chr = query.substring(i, i + 1);
                    if (chr === '+' || chr === '-' || chr === '!' || chr === '(' || chr === ')' || chr === '{' || chr === '}' || chr === '[' || chr === ']' || chr === '^' || chr === '"' || chr === '~' || chr === '*' || chr === '?' || chr === ':' || chr === "\\") {
                        newString += "\\" + chr;
                    } else {
                        newString += chr;
                    }
                }
            }
            return newString;
        }

    }

    export interface IParams {
        q: string;
        wt: string;
        version: string;
    }

    export interface IResponseHeader {
        status: number;
        QTime: number;
        params: Params;
    }

    export interface IResponse {
        numFound: number;
        start: number;
        docs: any[];
    }

    export class FilterQuery {
        public field: string;
        public value: string;
        constructor (field: string, value: string) {
            this.field = field;
            this.value = value;
        }
    }
    
    export class Params {
        public q: string = "";
        public fq: FilterQuery[] = [];
	    public start:number = 0;
	    public rows:number = 10;
    }

    export interface PagenatedNumber {
        selected: bool;
        pageNumber: number;
    }

    export interface PagenationModel {
        numFound: number;
        selectedPage: number;
        totalPages: number;
        canFirstPage: bool;
        canLastPage: bool;
        canNextPage: bool;
        canPrevPage: bool;
        pageNumbers: PagenatedNumber[];
        showPagenatedNumber: bool;
    }

    export class Pagenation {

        public p: number = 0;
        public response: IResponse = null;
        public params: Params = null;

        public pageNumbers(): PagenatedNumber[] {
            var pageNumbers: PagenatedNumber[];
            var startPage: number = (this.p) - (this.p % 4);
            var endPage: number = startPage + 4;
            var t: number = this.totalPage();
            if (endPage > t) {
                endPage = t;
            }
            pageNumbers = [];
            for (var i: number = startPage; i < endPage; i++) {
                if (i === this.p) {
                    pageNumbers.push({ selected: true, pageNumber: (i + 1) });
                } else {
                    pageNumbers.push({ selected: false, pageNumber: (i + 1) });
                }
            }
            return pageNumbers;
        }

        public totalPage(): number {
            return Math.floor(this.response.numFound / this.params.rows) + ((this.response.numFound % this.params.rows) > 0 ? 1 : 0);
        }

        public page(pageNumber: number): number {
            if (pageNumber !== undefined && pageNumber !== null) {
                if (this.canPage(pageNumber)) {
                    this.p = pageNumber;
                    this.params.start = (this.p) * this.params.rows;
                }
            } else {
                return this.p;
            }
        }

        public nextPage(): number {
            return this.page(this.p + 1);
        }
        public prevPage(): number {
            return this.page(this.p - 1);
        }
        public firstPage(): number {
            return this.page(0);
        }
        public lastPage(): number {
            return this.page(this.totalPage() - 1);
        }
        public canPage(pageNumber): bool {
            var s = (pageNumber) * this.params.rows;
            return (s > -1 && s < this.response.numFound);
        }
        public canNextPage(): bool {
            return (this.canPage(this.p + 1));
        }
        public canPrevPage(): bool {
            return (this.canPage(this.p - 1));
        }
        public canFirstPage(): bool {
            return ((this.response.numFound > 0) && (this.p > 0));
        }
        public canLastPage(): bool {
            return ((this.response.numFound > 0) && (this.p < this.totalPage() - 1));
        }
        public showPagenatedNumber(): bool {
            return true;
        }

        public getPagenationModel(): PagenationModel {
            return {
                numFound : this.response.numFound,
                selectedPage : this.p + 1,
                totalPages : this.totalPage(),
                canFirstPage : this.canFirstPage(),
                canLastPage : this.canLastPage(),
                canNextPage : this.canNextPage(),
                canPrevPage : this.canPrevPage(),
                pageNumbers : this.pageNumbers(),
                showPagenatedNumber : this.showPagenatedNumber()
            };
        }
    }
}
