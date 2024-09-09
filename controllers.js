$(document).ready(function() {
    $('.menu-toggle').click(function() {
        $('.off-screen-menu').toggleClass('active');
        // Toggle visibility of nav-list inside off-screen-menu
        $('.off-screen-menu .nav-list').toggle();
    });

    // Close the menu when clicking outside of it
    $(document).click(function(event) {
        if (!$(event.target).closest('.off-screen-menu, .menu-toggle').length) {
            $('.off-screen-menu').removeClass('active');
            // Hide nav-list when closing the menu
            $('.off-screen-menu .nav-list').hide();
        }
    });

    // Ensure nav-list is initially hidden on mobile
    if ($(window).width() <= 767) {
        $('.off-screen-menu .nav-list').hide();
    }

    // Update nav-list visibility on window resize
    $(window).resize(function() {
        if ($(window).width() <= 767) {
            if (!$('.off-screen-menu').hasClass('active')) {
                $('.off-screen-menu .nav-list').hide();
            }
        } else {
            $('.off-screen-menu .nav-list').show();
        }
    });

    // Remove dots from links
    $('.nav-list li').css('list-style-type', 'none');
});


// Hide off-screen menu for larger screens
function handleOffScreenMenu() {
    if ($(window).width() > 767) {
        $('.off-screen-menu').removeClass('active').hide();
        $('.off-screen-menu .nav-list').hide();
    } else {
        $('.off-screen-menu').show();
    }
}

// Call the function on document ready and window resize
$(document).ready(handleOffScreenMenu);
$(window).resize(handleOffScreenMenu);
