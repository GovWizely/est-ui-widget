var Utility = {
  parseQueryString: function(queryString) {
                      var result = {};
                      $.each(queryString.split('&'), function(index, value) {
                        if(value == '') {
                          return "";
                        }
                        var param = value.split('=');
                        result[param[0]] = param[1];
                      });
                      return result;
                    },

  countriesSelectBox: function() {
                        var selectBox = '<select name="countries">' +
                          '<option value="">Select country</option>';

                        $.each(Utility.countriesList, function(index, value) {
                          selectBox += '<option value="' + index + '">' + value + '</option>';
                        });

                        selectBox += '</select>';
                        return selectBox;
                      },

  countriesList: {
                   AU: 'Australia',
                   CA: 'Canada',
                   PK: 'Pakistan',
                   UK: 'United Kingdom',
                   US: 'United States'
                 }
};
