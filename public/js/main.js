$(document).ready(function() {
  $(".alert")
    .fadeTo(2000, 500)
    .slideUp(500, function() {
      $(".alert").slideUp(500);
    });
  $(".dropdown__heading").click(function() {
    $("#sort-menu").slideToggle();
  });
  $(".partnersLogoSlider").slick({
    slidesToShow: 4,
    arrows: false,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3
        },

        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2
        },

        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2
        }
      }
    ]
  });
});
