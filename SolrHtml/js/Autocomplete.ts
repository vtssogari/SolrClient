///<reference path="jquery.d.ts" />
///<reference path="jqueryui.d.ts" />
///<reference path='Configuration.ts' />

(function($) {
	
    $.fn.standardAutocomplete = function(solrUrl: string, fieldName:string) {
        $.ui.autocomplete.prototype._renderItem = function (ul, item) {
            var value = '';
            if (item.label) {
                value = item.label;
            } else {
                value = item["0"];
            }
            return $("<li></li>")
               .data("item.autocomplete", item)
               .append('<a>' + value + '</a>')
               .appendTo(ul);
        };
			 
        return this.autocomplete({
			source: function( request, response ) {		
				var solrGetUrl = solrUrl.replace("qValue", request.term);
				$.ajax(solrGetUrl,{
					dataType: 'jsonp',
                    jsonp: 'json.wrf',
					success: function( data ) {						
					    if (data.facet_counts.facet_fields[fieldName].length == 0) {
					        var result = [];
					        result.push("Not found");
                            response(result);
					    } else {
                            response( 
							    data.facet_counts.facet_fields[fieldName]
						    );
					    }
						
					},
					error:function (xhr, ajaxOptions, thrownError){
	                   alert(thrownError);
	                }    
				});
			},
			
			minLength: 1,

			select: function (event, ui) {
			    if (ui.item["0"]) {
			        this.value = ui.item["0"];
			        $.publish("/solr/filter", { field: fieldName, value: this.value });
			    }
				return false;					
			},
			focus: function() {
				return false; // prevent value inserted on focus
			},
			open: function() {
				$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			},
			close: function() {
				$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			}
		});        

    };
})(jQuery);
