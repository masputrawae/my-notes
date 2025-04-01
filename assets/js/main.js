// Utility functions
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Offcanvas functionality
const toggleOffcanvas = offcanvasId => {
    const offcanvas = $(`#${offcanvasId}`);
    offcanvas?.classList.toggle('offcanvas--is-open');

    if (offcanvas?.classList.contains('offcanvas--is-open')) {
        document.addEventListener('click', handleOutsideClick);
    } else {
        document.removeEventListener('click', handleOutsideClick);
    }

    function handleOutsideClick(event) {
        if (!offcanvas.contains(event.target) && !event.target.closest(`[data-toggle-offcanvas="${offcanvasId}"]`)) {
            offcanvas.classList.remove('offcanvas--is-open');
            document.removeEventListener('click', handleOutsideClick);
        }
    }
};

// 🔄 Kirim pesan ke Giscus untuk mengubah tema
const sendMessageToGiscus = (theme) => {
    const iframe = document.querySelector("iframe.giscus-frame");
    if (iframe) {
        iframe.contentWindow.postMessage(
            { giscus: { setConfig: { theme } } },
            "https://giscus.app"
        );
    }
};

// Theme management
const manageTheme = () => {
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        sendMessageToGiscus(theme); // 🔄 Kirim pesan ke Giscus
        $$('[data-theme-toggle]').forEach(button => {
            const icon = button.querySelector('i');
            icon.classList.toggle('bi-sun', theme === 'light');
            icon.classList.toggle('bi-moon-stars', theme === 'dark');
        });
    };

    const switchTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    };

    // Check user's system preference for theme
    const getSystemTheme = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Get saved theme or fallback to system preference
    const savedTheme = localStorage.getItem('theme') || getSystemTheme();
    setTheme(savedTheme);

    // Add event listeners for theme toggle buttons
    $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', switchTheme));
};

// Collapse functionality =============
const manageCollapse = () => {
    const toggleIcon = (icon, isCollapsed) => {
        icon?.classList.replace(
            isCollapsed ? "bi-folder2-open" : "bi-folder2",
            isCollapsed ? "bi-folder2" : "bi-folder2-open"
        );
    };

    const toggleFolderCollapse = (folder, isCollapsed) => {
        const sublist = folder.querySelector(".nav--tree");
        if (sublist) {
            sublist.classList.toggle("collapsed", isCollapsed);
            sessionStorage.setItem(`collapsed_${folder.id}`, isCollapsed);
            toggleIcon(folder.querySelector(".btn--folder i"), isCollapsed);
        }
    };

    $$(".btn--folder").forEach(button => {
        button.addEventListener("click", function () {
            const parentItem = this.closest(".nav__item--folder");
            if (parentItem) {
                const isCollapsed = parentItem.querySelector(".nav--tree").classList.toggle("collapsed");
                sessionStorage.setItem(`collapsed_${parentItem.id}`, isCollapsed);
                toggleIcon(this.querySelector("i"), isCollapsed);
            }
        });
    });

    $$(".nav__item--folder").forEach(folder => {
        const isCollapsed = sessionStorage.getItem(`collapsed_${folder.id}`) === "true";
        toggleFolderCollapse(folder, isCollapsed);
    });

    $("#toggleCollapseAll")?.addEventListener("click", () => {
        const allCollapsed = !$$(".nav__item--folder .nav--tree.collapsed").length;
        $$(".nav__item--folder").forEach(folder => toggleFolderCollapse(folder, allCollapsed));
        toggleIcon($("#toggleCollapseAll i"), allCollapsed);
    });
};

// Active link highlighting
const highlightActiveLink = () => {
    const currentPath = window.location.pathname.replace(/\/$/, "");
    $$(".nav--tree .btn--file").forEach(link => {
        if (link.pathname.replace(/\/$/, "") === currentPath) {
            link.classList.add("btn--active");
            link.closest(".nav__item--folder")?.classList.add("nav__item--open");
        }
    });
};

// Initialize all functionality
const init = () => {
    $$('[data-toggle-offcanvas]').forEach(button => {
        button.addEventListener('click', () => toggleOffcanvas(button.getAttribute('data-toggle-offcanvas')));
    });
    manageTheme();
    manageCollapse();
    highlightActiveLink();
};

// TOC Highlighter
const highlightTOC = () => {
    const tocLinks = $$('.nav--toc .btn--toc');
    const headings = $$('.markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6');
    const offset = 0;
    let activeHeadingId = null;

    // Get the currently active heading with more precise calculation
    const getActiveHeading = () => {
        let closestHeading = null;
        let closestDistance = Infinity;

        headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            const distance = Math.abs(rect.top - offset);
            
            if (rect.top <= offset + 20 && distance < closestDistance) {
                closestDistance = distance;
                closestHeading = heading;
            }
        });

        return closestHeading;
    };

    // Update active link in TOC
    const updateActiveLink = () => {
        const activeHeading = getActiveHeading();
        if (!activeHeading || activeHeadingId === activeHeading.id) return;
        
        activeHeadingId = activeHeading.id;
        tocLinks.forEach(link => {
            const linkHref = link.getAttribute('href').substring(1);
            link.classList.toggle('btn--active', linkHref === activeHeadingId);
        });
    };

    // Initialize highlight on first load
    updateActiveLink();

    // Handle scroll with optimized debounce
    let isScrolling;
    const handleScroll = () => {
        window.cancelAnimationFrame(isScrolling);
        isScrolling = window.requestAnimationFrame(updateActiveLink);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.cancelAnimationFrame(isScrolling);
    };
};

// Initialize TOC Highlighter
const cleanupHighlightTOC = highlightTOC();


// Search functionality
const initSearch = async () => {
    try {
        const searchUrl = $('#search').getAttribute('data-search-url');
        const store = await (await fetch(searchUrl)).json();

        const idx = lunr(function() {
            this.ref('id')
            this.field('title', { boost: 40 })
            this.field('tags', { boost: 30 })
            this.field('description', { boost: 10 })
            this.field('excerpt', { boost: 10 })
            this.field('category', { boost: 10 })
            this.field('content', { boost: 10 })
            store.forEach(doc => this.add(doc));
        });

        const displayResults = (results, query) => {
            const searchResults = $('#results');
            const resultsLabel = $('#resultsPanel');
            
            if (query) {
                resultsLabel.style.display = 'block';
                searchResults.innerHTML = results.length
                    ? results.map(result => {
                        const item = store.find(doc => doc.id === result.ref);
                        return `
                            <li class="nav__item">
                                <a class="btn btn--text-xs" href="${item.url}">
                                    <span>${item.title}</span>
                                </a>
                            </li>`;
                    }).join('')
                    : '<li class="nav__item">No results found.</li>';
            } else {
                resultsLabel.style.display = 'none';
                searchResults.innerHTML = "";
            }
        };

        const handleSearch = event => {
            event?.preventDefault();
            const query = $('#search-input').value.trim();
            if (query) {
                const results = idx.search(`*${query}* ${query}~1`);
                displayResults(results, query);
            } else {
                $('#resultsPanel').style.display = 'none';
                $('#results').innerHTML = "";
            }
        };

        const debounce = (func, wait = 300) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        };

        $('#search-input').addEventListener('input', debounce(() => handleSearch(new Event('submit'))));

        const query = new URLSearchParams(window.location.search).get('query');
        if (query) {
            $('#search-input').setAttribute('value', query);
            setTimeout(() => handleSearch(new Event('submit')), 100);
        } else {
            $('#resultsPanel').style.display = 'none';
        }
    } catch (error) {
        console.error("Gagal memuat data pencarian:", error);
    }
};

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
    init();
    initSearch();
});

const manageNavbarWrapper = () => {
    $$(".navbar__wrapper").forEach(wrapper => {
        const taxonomy = wrapper.dataset.taxonomy;
        const groups = [...wrapper.querySelectorAll('[data-group]')];
        let currentIndex = 0;

        const prevBtn = $(`.btn--prev[data-taxonomy="${taxonomy}"]`);
        const nextBtn = $(`.btn--next[data-taxonomy="${taxonomy}"]`);

        const updateVisibility = () => {
            groups.forEach((group, index) => group.style.display = index === currentIndex ? "block" : "none");
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === groups.length - 1;
        };

        [prevBtn, nextBtn].forEach((btn, isNext) => {
            btn.addEventListener("click", () => {
                currentIndex += isNext ? 1 : -1;
                updateVisibility();
            });
        });

        updateVisibility();
    });
};

// Initialize Navbar Wrapper functionality
manageNavbarWrapper();