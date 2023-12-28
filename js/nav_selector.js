(function() {
    "use strict";

    const pageId = document.body.id;
    const navLinkId = `${pageId}_link`;

    const navLink = document.getElementById(navLinkId);
    navLink.style['color'] = 'black';
    navLink.style['pointer-events'] = 'none';
})();
