$(document).ready(function () {
  $(".alert")
    .fadeTo(2000, 500)
    .slideUp(500, function () {
      $(".alert").slideUp(500);
    });

  $(".dropdown__heading").click(function () {
    $("#menu").slideToggle();
  });

  $(".sizes li").click(function () {
    let size = $(this).text();
    $(".size-header").text(size);
    $("#size").val(size);
    $("#menu").slideUp();
  });


  $('.incr-cart').click(function (event) {
    event.preventDefault();
    $(this).closest('td').find('#form').submit();
  });

  $('.dcr-cart').click(function (event) {
    console.log("clicked")
    event.preventDefault();
    $(this).closest('td').find('#decform').submit();
  });

  $("#images").change(function () {
    var files = $(this)[0].files;
    if (files.length > 3) {
      // alert("You can select max 3 images.");
      $(".alert").show();
      $("#images").val("");
      return false;
    } else {
      return true;
    }
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
