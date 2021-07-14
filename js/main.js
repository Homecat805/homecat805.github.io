$(document).ready(function(){

	// Navigation - Main
	$("#menu-toggle").click(function () {
		$("#menu-content").slideToggle(250);
		$("#langswitch").slideToggle(250);
	});
	// Navigation - Main End

	// Carousel
	$(".carousel-control-right").click(function () {
		$(".carousel-content").children(".active").fadeOut(1000);
		if ( $(".carousel-content").children(".active").next().length > 0 ){
			$(".carousel-content").children(".active").next()
				.fadeIn(1000)
				.addClass("active");
			$(".carousel-content").children(".active").first().removeClass("active");
		}
		else {
			$(".carousel-content").children(".carousel-content-item").first()
				.fadeIn(1000)
				.addClass("active");
			$(".carousel-content").children(".active").last().removeClass("active");
		}
	})

	$(".carousel-control-left").click(function () {
		$(".carousel-content").children(".active").fadeOut(1000);
		if ( $(".carousel-content").children(".active").prev().length > 0 ){
			$(".carousel-content").children(".active").prev()
				.fadeIn(1000)
				.addClass("active");
			$(".carousel-content").children(".active").last().removeClass("active");
		}
		else {
			$(".carousel-content").children(".carousel-content-item").last()
				.fadeIn(1000)
				.addClass("active");
			$(".carousel-content").children(".active").first().removeClass("active");
		}
	});
	// Carousel End

});
