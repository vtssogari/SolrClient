

// Module
module solr {

    export interface ViewPerPages {
        name: string;
        label: string;
        params: string;
        selected: bool;
    }

    export interface Field {
        name: string;
        label: string;
        autocomplete?: string;
        styleProperty?: string;
    }

    // Class
    export class Configuration {

        //public static fragSize:number = 85;
        public static host:string = "http://localhost:8983/solr/select/?version=2.2&wt=json&json.nl=arrarr";
        public static rows:string = '&rows=10';
        
        public static viewsPerPageOptions: ViewPerPages[] = [
            { name: "10", label: "10", params: "&rows=10", selected: true },
            { name: "20", label: "20", params: "&rows=20", selected: false },
            { name: "50", label: "50", params: "&rows=50", selected: false },
            { name: "100", label: "100", params: "&rows=100", selected: false },
            { name: "200", label: "200", params: "&rows=200", selected: false },
            { name: "500", label: "500", params: "&rows=500", selected: false }
        ];
        
        public static fields: Field[] = [
            {name: "name",      autocomplete: "auto_name",          label: "name",              styleProperty: "width: 100px"}, 
            {name: "features",  autocomplete: "auto_features",      label: "features",          styleProperty: "width: 140px"},
            {name: "price",     autocomplete: "auto_price",         label: "price",             styleProperty: "width: 100px"}, 
            {name: "inStock",   autocomplete: "auto_inStock",       label: "in Stock",          styleProperty: "width: 100px"}, 
            {name: "manu",      autocomplete: "auto_manu",          label: "Manufacturer",      styleProperty: "width: 100px"}, 
            {name: "cat",       autocomplete: "auto_cat",           label: "Category",          styleProperty: "width: 100px"}
        ];
    }
}
