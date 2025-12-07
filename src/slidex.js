function Slidex(selector, options = {}) {
  this.container = document.querySelector(selector);
  if (!this.container) {
    console.error(`Slidex: not found ${selector}.`);
    return;
  }

  this.opt = Object.assign(
    {
      item: 1,
      speed: 300,
      loop: false,
      navigation: true,
      control: true,
      controlText: ["<", ">"],
      prevButton: null,
      nextButton: null,
      slideBy: 1,
      autoplay: false,
      autoplayTimeout: 3000,
      autoplayHoverPause: true,
    },
    options
  );
  this.slides = Array.from(this.container.children); // Lấy con trực tiếp của container
  this.currentIndex = this.opt.loop ? this.opt.item : 0;

  this._init();
  this._updatePosition();
}

// Hàm khởi tạo
Slidex.prototype._init = function () {
  this.container.classList.add("slidex-wrapper");

  this._createContent();
  this._createTrack();

  const showNav = this._getSlideCount() > this.opt.item;
  if (this.opt.control) {
    this._createControl();
  }
  if (this.opt.navigation && showNav) {
    this._createNavigation();
  }
  if (this.opt.autoplay) {
    this._startAutoplay();

    if (this.opt.autoplayHoverPause) {
      this.container.onmouseenter = () => this._stopAutoplay();
      this.container.onmouseleave = () => this._startAutoplay();
    }
  }
};

// Hàm start tự động trượt slide
Slidex.prototype._startAutoplay = function () {
  if (this.autoplayTimer) return;

  const slideBy = this._getSlideBy();

  this.autoplayTimer = setInterval(() => {
    this.moveSlide(slideBy);
  }, this.opt.autoplayTimeout);
};

// Hàm stop tự động trượt slide
Slidex.prototype._stopAutoplay = function () {
  clearInterval(this.autoplayTimer);
  this.autoplayTimer = null;
};

// Hàm tạo box chứa track và btn control
Slidex.prototype._createContent = function () {
  this.content = document.createElement("div");
  this.content.className = "slidex-content";
  this.container.appendChild(this.content);
};

// Hàm tạo Danh sách chứa các slide
Slidex.prototype._createTrack = function () {
  this.track = document.createElement("div");
  this.track.className = "slidex-track";

  // Xử lý loop vô hạn
  if (this.opt.loop) {
    const cloneHead = this.slides
      .slice(-this.opt.item)
      .map((node) => node.cloneNode(true));
    const cloneTail = this.slides
      .slice(0, this.opt.item)
      .map((node) => node.cloneNode(true));
    this.slides = cloneHead.concat(this.slides.concat(cloneTail));
  }

  this.slides.forEach((slide) => {
    slide.classList.add("slidex-slide");
    slide.style.flexBasis = `calc(100% / ${this.opt.item} )`;
    this.track.appendChild(slide);
  });
  this.content.appendChild(this.track);
};

// Hàm tạo các controls (prev, next)
Slidex.prototype._createControl = function () {
  this.prevBtn = this.opt.prevButton
    ? document.querySelector(this.opt.prevButton)
    : document.createElement("button");
  this.nextBtn = this.opt.nextButton
    ? document.querySelector(this.opt.nextButton)
    : document.createElement("button");

  if (!this.opt.prevButton) {
    this.prevBtn.textContent = this.opt.controlText[0];
    this.prevBtn.classList.add("slidex-prev");
    this.content.append(this.prevBtn);
  }

  if (!this.opt.prevButton) {
    this.nextBtn.textContent = this.opt.controlText[1];
    this.nextBtn.classList.add("slidex-next");
    this.content.append(this.nextBtn);
  }

  const stepSize = this._getSlideBy();

  this.prevBtn.onclick = () => this.moveSlide(-stepSize);
  this.nextBtn.onclick = () => this.moveSlide(stepSize);
};

// Hàm lấy số bước nhảy slide
Slidex.prototype._getSlideBy = function () {
  return this.opt.slideBy === "page" ? this.opt.item : this.opt.slideBy;
};

// Hàm lấy số lượng slide gốc
Slidex.prototype._getSlideCount = function () {
  return this.slides.length - (this.opt.loop ? this.opt.item * 2 : 0);
};

// Hàm tạo nav
Slidex.prototype._createNavigation = function () {
  this.navWrapper = document.createElement("div");
  this.navWrapper.className = "slidex-nav";

  const slideCount = this._getSlideCount();
  const pageCount = Math.ceil(slideCount / this.opt.item);

  for (let i = 0; i < pageCount; i++) {
    const dot = document.createElement("button");
    dot.className = "slidex-dot";

    if (i === 0) dot.classList.add("active");

    dot.onclick = () => {
      this.currentIndex = this.opt.loop
        ? i * this.opt.item + this.opt.item
        : i * this.opt.item;
      this._updatePosition();
    };
    this.navWrapper.appendChild(dot);
  }
  this.container.appendChild(this.navWrapper);
};

// Hàm xử lý logic trượt giữa các slide
Slidex.prototype.moveSlide = function (step) {
  if (this._isAnimating) return;
  this._isAnimating = true;

  const maxIndex = this.slides.length - this.opt.item;

  this.currentIndex = Math.min(Math.max(this.currentIndex + step, 0), maxIndex);

  setTimeout(() => {
    if (this.opt.loop) {
      const slideCount = this._getSlideCount();
      if (this.currentIndex < this.opt.item) {
        this.currentIndex += slideCount;
        this._updatePosition(true);
      } else if (this.currentIndex >= slideCount) {
        this.currentIndex -= slideCount;
        this._updatePosition(true);
      }
    }
    this._isAnimating = false;
  }, this.opt.speed);

  this._updatePosition();
};

// Hàm cập nhật lại vị trí nav cần active
Slidex.prototype._updateNav = function () {
  let realIndex = this.currentIndex;

  if (this.opt.loop) {
    const slideCount = this.slides.length - this.opt.item * 2;
    realIndex = (this.currentIndex - this.opt.item + slideCount) % slideCount;
  }

  const pageIndex = Math.floor(realIndex / this.opt.item);

  const dots = Array.from(this.navWrapper.children);
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === pageIndex);
  });
};

// Hàm cập nhật hiệu ứng chuyển động slide
Slidex.prototype._updatePosition = function (instant = false) {
  this.track.style.transition = instant
    ? "none"
    : `transform ${this.opt.speed}ms ease`;
  this.offset = -(this.currentIndex * (100 / this.opt.item));
  this.track.style.transform = `translateX(${this.offset}%)`;

  if (this.opt.navigation && !instant) {
    this._updateNav();
  }
};
