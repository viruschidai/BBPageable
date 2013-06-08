;/**
  * @author billg(viruschidai@gmail.com)
  * This is a backbone.js based paginator.
  */
(function() {
  var BBLib;

  if (!this.BBLib) {
    BBLib = this.BBLib = {}
    BBLib.VERSION = "0.1.0";
  } else {
    BBLib = this.BBLib;
  }

  var SortingModel = BBLib.SortingModel = Backbone.Model.extend({
    defaults: {
      sortDir: 1,
      sortKey: "id", 
      comparator: null
    }
  });

  function getDefaultComparator(key, dir) {
    return function(left, right) {
      var a = left.get(key),
          b = right.get(key);

      if (a > b) {
        return dir === "asc" ? 1 : -1;
      }

      if (a < b){
        return dir === "desc" ? 1 : -1;
      }

      return 0;
    };
  };

  var ClientSidePageable = BBLib.ClientSidePageable = Backbone.Collection.extend({
    initialize: function(options) {
      this.paginationModel = options.paginationModel || new BBLib.PaginationModel();
      this.sortingModel = options.sortingModel || new SortingModel();
      this.cachedResults = new Backbone.Collection();
      this.comparator = options.comparator || getDefaultComparator;

      this.paginationModel.on("change:page change:pageSize", function(e) {
        this.reset(this._getCurrentPage());
      }, this);

      this.sortingModel.on("change", function(e) {
        this.cachedResults.comparator = this.comparator(this.sortingModel.get('sortKey'), this.sortingModel.get('sortDir'));
        this.cachedResults.sort({sort: false});
        this.reset(this._getCurrentPage());
      }, this);
    },

    parse: function(res, options) {
      this.paginationModel.set('numOfRecords', res.length);
      this.cachedResults.reset(res)
      return this._getCurrentPage();
    },

    _getCurrentPage: function() {
      var currentPage = this.paginationModel.get("page");
      return this._getPage(currentPage);
    },

    _getPage: function(page) {
      var pageSize = this.paginationModel.get("pageSize"),
          pageStart = page * pageSize;

      if (pageSize === 0) {
          return this.cachedResults;
      } else {
          return this.cachedResults.slice(pageStart, pageStart + pageSize);
      }
    }
  });

  var ServerSidePageable = BBLib.ServerSidePageable = Backbone.Collection.extend({
    initialize: function(options) {
      this.paginationModel = options.paginationModel || new BBLib.PaginationModel();
      this.sortingModel = options.sortingModel || new SortingModel();

      this.paginationModel.on("change:page change:pageSize", function() {
        this.fetch();
      }, this);
      
      this.sortingModel.on("change", function(e) {
        this.fetch();
      }, this);
    },

    fetch: function() {
      arguments.data = _.defaults({}, this.paginationModel.attributes, this.sortingModel.attributes, arguments.data);
      return Backbone.Collection.prototype.fetch.call(this, arguments);
    },

    parse: function(res, options){
      this.paginationModel.set('numOfRecords', res.numOfRecords);
      return res.page;
    } 
  });
})(this);

