module.exports = Backbone.View.extend({
		className: 'schedule row-fluid',

		template: _.template($('#arrival-template').html()),

		events: {
			'click .row-fluid': 'showMap',
			'click .arrow': 'showMap'
		},

		routeType: {
		    '0': 'light-rail',
		    '3': 'bus',
		    '4': 'ferry'
		},

		initialize: function() {
			this.model.on('change', this.render, this);
			this.model.on('remove', this.remove, this);
			$(window).resize($.proxy(this.resize, this));
			App.Intervals.push(setInterval($.proxy(this.updateTime, this), 10000));
		},

		updateTime: function() {
		    var minutesToArrival = this.model.minutesFromNow();

		    this.$('.timeframe').html(this.minutesFromNowToString(minutesToArrival));
		    this.$('.lastUpdate').html(this.model.lastCheckinTimeDescription());
		    this.$('.timeframe').removeClass('departed imminent enroute');

		    if(minutesToArrival < 0) {
		        this.$('.timeframe').addClass('departed');
		    } else if (minutesToArrival >= 0 && minutesToArrival <= 5) {
		    	this.$('.timeframe').addClass('imminent');
		    } else {
		    	this.$('.timeframe').addClass('enroute');
		    }
		},

		minutesFromNowToString: function(minutesFromNow) {
		    if(minutesFromNow == 0) return 'Now';
		    if(minutesFromNow < 0) return 'Gone';
		    return minutesFromNow;
		},

		render: function() {
		    var mapShowing = this.$('.mapcanvas').is(':visible');
		    var minutesToArrival = this.model.minutesFromNow();

			this.$el.html(this.template({
				routeId: this.model.get('route_id'),
				destination: this.model.get('destination'),
				arriveTime: this.model.localTime(),
				adherence: this.model.adherenceDescription(),
				arriveMinutes: this.minutesFromNowToString(minutesToArrival),
				busId: this.model.get('busId'),
				lastUpdate: this.model.lastCheckinTimeDescription()
			}));

			this.updateTime();
			this.$el.attr('data-id', this.model.id);
			this.$el.addClass(this.routeType[this.model.get('routeType')] + '-route');

			if(mapShowing) {
			    this.showMap(null);
			}

			return this;
		},

		showMap: function(scroll) {
		    var mapShowing = this.$('.mapcanvas').is(':visible');

			$('.extended-info').hide();
			$('.mapcanvas').hide();
			$('.arrow > img').attr('src', './img/arrow-down.png');

			if(!mapShowing) {
				App.MapView.clear();
				App.MapView.createStopMarker(this.options.stop);
    			App.MapView.createBusMarker(this.model);
    			this.resize(true);
    			this.$('.mapcanvas').html(App.MapView.el);

				this.$('.arrow > img').attr('src', './img/arrow-up.png');
			    this.$('.extended-info').show();
				this.$('.mapcanvas').show();
				App.MapView.resize();
				App.MapView.setBounds();

				if(scroll) {
				    $('html,body').animate({scrollTop: this.$el.offset().top - 50 }, 'slow');
			    }
			}
		},

		resize: function(force) {
		    var mapShowing = this.$('.mapcanvas').is(':visible');
		    if(force || mapShowing) {
		        var scheduleHeight = $('.schedule').height();
				var	headerHeight = $('.navbar').height();
				var	stopHeight = $('.stop-name').height();
				var	headHeight = $('.head-label').height();
				var mapHeight = window.innerHeight - (headerHeight + scheduleHeight + stopHeight + headHeight + 6);
				App.MapView.$el.height(mapHeight);
				App.MapView.resize();
				App.MapView.setBounds();
	        }
		}
	});
