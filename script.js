const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeStorageKey = "java-guide-theme";

function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(themeStorageKey);
        return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
    } catch (error) {
        console.warn("The saved theme preference could not be read.", error);
        return "light";
    }
}

function setTheme(theme, savePreference = false) {
    const isDark = theme === "dark";
    document.body.dataset.theme = isDark ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
    themeColor.setAttribute("content", isDark ? "#192126" : "#f8f4eb");

    if (savePreference) {
        try {
            localStorage.setItem(themeStorageKey, theme);
        } catch (error) {
            console.warn("The theme preference could not be saved.", error);
        }
    }
}

setTheme(getSavedTheme());

themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
});

const carousel = document.querySelector("[data-carousel]");

if (carousel) {
    const slides = [...carousel.querySelectorAll(".carousel-slide")];
    const dots = [...carousel.querySelectorAll(".carousel-dot")];
    const currentSlide = carousel.querySelector("[data-slide-current]");
    const rotationToggle = carousel.querySelector("[data-carousel-toggle]");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeSlide = 0;
    let rotationEnabled = !motionPreference.matches;
    let hasUserSetRotation = false;
    let isHovered = false;
    let isFocused = false;
    let isInViewport = true;
    let rotationTimer;

    function scheduleRotation() {
        window.clearTimeout(rotationTimer);
        rotationTimer = undefined;

        const shouldRespectReducedMotion = motionPreference.matches && !hasUserSetRotation;
        const canRotate = rotationEnabled
            && !shouldRespectReducedMotion
            && !document.hidden
            && !isHovered
            && !isFocused
            && isInViewport;

        rotationToggle.setAttribute("aria-pressed", String(rotationEnabled));
        carousel.querySelector(".carousel-track").setAttribute("aria-live", canRotate ? "off" : "polite");

        if (canRotate) {
            rotationTimer = window.setTimeout(() => showSlide(activeSlide + 1), 6000);
        }
    }

    function showSlide(index) {
        activeSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeSlide;
            slide.hidden = !isActive;
            slide.inert = !isActive;
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.classList.toggle("is-active", isActive);
        });

        dots.forEach((dot, dotIndex) => {
            const isActive = dotIndex === activeSlide;
            dot.classList.toggle("is-active", isActive);
            if (isActive) {
                dot.setAttribute("aria-current", "true");
            } else {
                dot.removeAttribute("aria-current");
            }
        });

        currentSlide.textContent = String(activeSlide + 1).padStart(2, "0");
        scheduleRotation();
    }

    carousel.querySelector("[data-slide-previous]").addEventListener("click", () => {
        showSlide(activeSlide - 1);
    });

    carousel.querySelector("[data-slide-next]").addEventListener("click", () => {
        showSlide(activeSlide + 1);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => showSlide(index));
    });

    rotationToggle.addEventListener("click", () => {
        hasUserSetRotation = true;
        rotationEnabled = !rotationEnabled;
        scheduleRotation();
    });

    carousel.addEventListener("pointerenter", () => {
        isHovered = true;
        scheduleRotation();
    });
    carousel.addEventListener("pointerleave", () => {
        isHovered = false;
        scheduleRotation();
    });
    carousel.addEventListener("focusin", () => {
        isFocused = true;
        scheduleRotation();
    });
    carousel.addEventListener("focusout", () => {
        window.setTimeout(() => {
            isFocused = carousel.contains(document.activeElement);
            scheduleRotation();
        }, 0);
    });
    document.addEventListener("visibilitychange", scheduleRotation);
    motionPreference.addEventListener("change", (event) => {
        if (!hasUserSetRotation) {
            rotationEnabled = !event.matches;
        }
        scheduleRotation();
    });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
            isInViewport = entry.isIntersecting;
            scheduleRotation();
        });
        observer.observe(carousel);
    }

    showSlide(activeSlide);
}

async function copyCode(button) {
    const code = document.getElementById(button.dataset.copyTarget);
    const feedback = button.closest(".code-example").querySelector(".copy-feedback");
    const label = button.querySelector(".copy-label");

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(code.textContent);
        } else {
            const selection = document.createElement("textarea");
            selection.value = code.textContent;
            selection.setAttribute("readonly", "");
            selection.style.position = "fixed";
            selection.style.opacity = "0";
            document.body.append(selection);
            selection.select();
            let copied;
            try {
                copied = document.execCommand("copy");
            } finally {
                selection.remove();
            }
            if (!copied) {
                throw new Error("The browser did not allow the text to be copied.");
            }
        }

        label.textContent = "Copied";
        feedback.textContent = "Code copied to the clipboard.";
    } catch (error) {
        feedback.textContent = "Could not copy the code. Select it and copy it manually.";
        console.warn("The code could not be copied.", error);
    }

    window.setTimeout(() => {
        label.textContent = "Copy code";
    }, 1800);
}

document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", () => copyCode(button));
});

const demoForm = document.querySelector("#demo-form");
const nameInput = document.querySelector("#demo-name");
const ageInput = document.querySelector("#demo-age");
const demoMessage = document.querySelector("#demo-message");
const demoOutput = document.querySelector("#demo-output");

demoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const age = ageInput.valueAsNumber;
    const validName = name.length > 0;
    const validAge = Number.isInteger(age) && age >= 0;

    nameInput.setAttribute("aria-invalid", String(!validName));
    ageInput.setAttribute("aria-invalid", String(!validAge));

    if (!validName || !validAge) {
        demoMessage.dataset.state = "error";
        demoMessage.textContent = "Enter a name and a whole number age of zero or more.";
        if (!validName) {
            nameInput.focus();
        } else {
            ageInput.focus();
        }
        return;
    }

    delete demoMessage.dataset.state;
    demoMessage.textContent = "Demo result:";
    demoOutput.textContent = `Hello, ${name}. You are ${age} years old.`;
});

[nameInput, ageInput].forEach((input) => {
    input.addEventListener("input", () => {
        input.removeAttribute("aria-invalid");
        delete demoMessage.dataset.state;
        demoMessage.textContent = "Update the values and run the example.";
    });
});

const navigationLinks = [...document.querySelectorAll(".desktop-nav a, .mobile-nav a")];
const navigationSections = [...new Set(navigationLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean))];

function updateCurrentSection() {
    const readingLine = Math.min(240, window.innerHeight * 0.3);
    const passedSections = navigationSections
        .filter((section) => section.getBoundingClientRect().top <= readingLine);
    const currentSection = passedSections[passedSections.length - 1] ?? navigationSections[0];

    navigationLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${currentSection.id}`) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

window.addEventListener("scroll", updateCurrentSection, { passive: true });
window.addEventListener("resize", updateCurrentSection);
updateCurrentSection();
