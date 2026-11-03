// Light / dark theme: applied before first paint, remembered per visitor.
(function () {
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem('ijbtcs-theme'); } catch (e) {}
    root.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');

    function syncButton(btn) {
        var light = root.getAttribute('data-theme') === 'light';
        btn.innerHTML = light ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    }

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.querySelector('.theme-toggle');
        if (!btn) return;
        syncButton(btn);
        btn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('ijbtcs-theme', next); } catch (e) {}
            syncButton(btn);
        });
    });
})();
