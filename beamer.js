(() => {
  const pdfjsLib = window["pdfjs-dist/build/pdf"] || window.pdfjsLib;
  if (!pdfjsLib) {
    console.error("PDF.js is not available.");
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const pdfUrl = "presentation.pdf";
  const canvas = document.getElementById("pdfCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const loader = document.getElementById("loader");
  const progressBar = document.getElementById("progressBar");
  const statusText = document.getElementById("statusText");
  const renderHint = document.getElementById("renderHint");
  const canvasWrap = document.getElementById("canvasWrap");
  const pageNumEl = document.getElementById("pageNum");
  const pageCountEl = document.getElementById("pageCount");
  const pageSlider = document.getElementById("pageSlider");
  const pageProgress = document.getElementById("pageProgress");
  const zoomLevel = document.getElementById("zoomLevel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const fitWidthBtn = document.getElementById("fitWidth");
  const fullscreenBtn = document.getElementById("fullscreen");

  let pdfDoc = null;
  let pageNum = 1;
  let pageRendering = false;
  let pageNumPending = null;
  let scale = 1;
  let fitMode = true;
  let firstRenderDone = false;

  const minScale = 0.6;
  const maxScale = 2.5;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateZoomReadout = () => {
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
  };

  const updatePageUI = () => {
    pageNumEl.textContent = pageNum;
    pageSlider.value = pageNum;
    if (pdfDoc) {
      pageProgress.style.width = `${(pageNum / pdfDoc.numPages) * 100}%`;
    }
    updateZoomReadout();
  };

  const getFitScale = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    const availableWidth = canvasWrap.clientWidth - 32;
    const availableHeight = canvasWrap.clientHeight - 32;
    if (availableWidth <= 0 || availableHeight <= 0) {
      return scale;
    }
    const scaleX = availableWidth / viewport.width;
    const scaleY = availableHeight / viewport.height;
    return clamp(Math.min(scaleX, scaleY), minScale, maxScale);
  };

  const renderPage = (num) => {
    pageRendering = true;
    canvasWrap.classList.add("is-rendering");
    renderHint.textContent = `Rendering slide ${num}...`;

    pdfDoc
      .getPage(num)
      .then((page) => {
        const nextScale = fitMode ? getFitScale(page) : clamp(scale, minScale, maxScale);
        scale = nextScale;

        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderTask = page.render({ canvasContext: ctx, viewport });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Render timeout")), 15000)
        );

        return Promise.race([renderTask.promise, timeoutPromise]);
      })
      .then(() => {
        pageRendering = false;
        canvasWrap.classList.remove("is-rendering");
        renderHint.textContent = "";
        updatePageUI();

        if (!firstRenderDone) {
          loader.classList.remove("is-active");
          firstRenderDone = true;
        }

        if (pageNumPending !== null) {
          const nextPage = pageNumPending;
          pageNumPending = null;
          renderPage(nextPage);
        }
      })
      .catch((error) => {
        console.error(error);
        pageRendering = false;
        canvasWrap.classList.remove("is-rendering");
        renderHint.textContent = "";
        statusText.textContent = `Error: ${error.message}`;
      });
  };

  const queueRenderPage = (num) => {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  };

  const onPrevPage = () => {
    if (pageNum <= 1) {
      return;
    }
    pageNum -= 1;
    queueRenderPage(pageNum);
  };

  const onNextPage = () => {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) {
      return;
    }
    pageNum += 1;
    queueRenderPage(pageNum);
  };

  const adjustZoom = (delta) => {
    fitMode = false;
    scale = clamp(scale + delta, minScale, maxScale);
    queueRenderPage(pageNum);
  };

  const setFitMode = () => {
    fitMode = true;
    queueRenderPage(pageNum);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasWrap.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  loader.classList.add("is-active");

  const loadingTask = pdfjsLib.getDocument({
    url: pdfUrl,
    cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
    cMapPacked: true,
  });
  loadingTask.onProgress = (progressData) => {
    if (progressData.total) {
      const percent = Math.round((progressData.loaded / progressData.total) * 100);
      progressBar.style.width = `${percent}%`;
      statusText.textContent = `Loading PDF... ${percent}%`;
    }
  };

  loadingTask.promise
    .then((pdf) => {
      pdfDoc = pdf;
      pageCountEl.textContent = pdf.numPages;
      pageSlider.max = pdf.numPages;
      pageSlider.value = pageNum;
      updatePageUI();
      renderPage(pageNum);
    })
    .catch((error) => {
      console.error(error);
      statusText.textContent = "Unable to load the PDF.";
    });

  prevBtn.addEventListener("click", onPrevPage);
  nextBtn.addEventListener("click", onNextPage);
  zoomInBtn.addEventListener("click", () => adjustZoom(0.1));
  zoomOutBtn.addEventListener("click", () => adjustZoom(-0.1));
  fitWidthBtn.addEventListener("click", setFitMode);
  fullscreenBtn.addEventListener("click", toggleFullscreen);

  pageSlider.addEventListener("input", (event) => {
    pageNum = Number(event.target.value);
    queueRenderPage(pageNum);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      onNextPage();
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      onPrevPage();
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      adjustZoom(0.1);
    }
    if (event.key === "-") {
      event.preventDefault();
      adjustZoom(-0.1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      pageNum = 1;
      queueRenderPage(pageNum);
    }
    if (event.key === "End" && pdfDoc) {
      event.preventDefault();
      pageNum = pdfDoc.numPages;
      queueRenderPage(pageNum);
    }
  });

  canvasWrap.addEventListener("dblclick", () => {
    fitMode = !fitMode;
    queueRenderPage(pageNum);
  });

  canvasWrap.addEventListener("wheel", (event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      adjustZoom(event.deltaY > 0 ? -0.08 : 0.08);
    }
  });

  window.addEventListener("resize", () => {
    if (fitMode && pdfDoc) {
      queueRenderPage(pageNum);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (fitMode && pdfDoc) {
      setTimeout(() => queueRenderPage(pageNum), 100);
    }
  });
})();
