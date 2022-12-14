const scrollSlider = document.querySelectorAll('.js-scroll-slider');
if(scrollSlider.length > 0) {
	scrollSlider.forEach(slider => {
		//スクロールスピード設定
		const speed = slider.dataset.autoSpeedRatio ? Number(slider.dataset.autoSpeedRatio) : 0.5;

		//observer監視用 親要素生成
		const sliderWrap = document.createElement('div');
		sliderWrap.classList.add('js-scroll-slider-wrap');
		slider.after(sliderWrap);
		sliderWrap.append(slider);

		//スライド要素を取得
		const children = slider.children;
		const childLength = children.length;

		//スライド要素一式を文字列で取得（複製用）
		let baseChildren = '';
		for (let i = 0; i < children.length; i++) {
			baseChildren += children[i].outerHTML;
		}

		//スライド要素取得
		const firstChild = slider.firstElementChild;

		//スライダー定義関数
		let sliderWidth,winWidth;
		let countWidth = 0;
		let addCount = 1;
		const initializeSlider = (countWidth, addCount) => {
			//スライダー全体の幅を取得
			const styles = getComputedStyle(firstChild);
			const width = parseFloat(styles.width);
			const marginRight = parseFloat(styles.marginRight);
			sliderWidth = (width + marginRight) * childLength;

			//画面外まで表示を確保するため要素を複製
			winWidth = window.innerWidth;
			const checkWidth = winWidth * 3;
			countWidth = sliderWidth * addCount;
			while(countWidth < checkWidth) {
				slider.insertAdjacentHTML('beforeend',baseChildren);
				++addCount;
				countWidth = sliderWidth * addCount;
			}

			//スライダー位置
			slider.style.marginLeft = '-' + sliderWidth + 'px';
		}
		initializeSlider(countWidth, addCount);


		/*
			アニメーション設定
		*/
		let requestID;
		let x = 0;

		//反転処理判別
		const isReverse = slider.classList.contains('is-reverse');

		//スクロール関数
		const scrollAnime = () => {
			//スライダーの終了ポイントを過ぎていたら位置を戻す
			if(!isReverse && x <= -sliderWidth || isReverse && x >= sliderWidth) {
				x = 0;
			}
			slider.style.transform = 'translateX(' + x + 'px)';
			if(isReverse) {
				x += 1 * speed;

			} else {
				x -= 1 * speed;
			}
			requestID = requestAnimationFrame(scrollAnime);
		}


		/*
			スワイプ、ドラッグ対応
		*/
		//スライダーのstyleを取得
		const sliderStyles = getComputedStyle(slider);
		//クリック、タッチされているか判別
		let isDown = false;
		//スワイプ、ドラッグで右に動かしているか判別
		let isRightMove = false;
		// クリック開始位置を保存
		let startX;
		//スライダー位置を保存
		let sliderX;
		//画面内に存在しているか判別
		let isIntersecting = false;

		//マウスダウン、タッチスタート（移動開始）
		const startFunc = e => {
			e.preventDefault();
			//画面上のx位置を取得
			if(e.type === 'touchstart') {
				startX = e.changedTouches[0].pageX;
			} else {
				startX = e.pageX;
			}
			//スライダーにclass追加
			slider.classList.add('is-drag');
			isDown = true;

			//マウスポインタを変更
			sliderWrap.style.cursor = 'grabbing';

			//自動スクロール停止
			cancelAnimationFrame(requestID);

			//スライダー位置取得
			let matrix = new DOMMatrix(sliderStyles.transform);
			sliderX = parseFloat(matrix.m41);
		}

		//マウスムーブ、タッチムーブ（移動中）
		const moveFunc = e => {
			//マウスダウン、タッチスタート時のみ処理
			if(!isDown) {
				return;
			}
			e.preventDefault();
			//移動距離を取得
			let moveX;
			if(e.type === 'touchmove') {
				moveX = startX - e.changedTouches[0].pageX;
			} else {
				moveX = startX - e.pageX;
			}
			//左右どちらに移動しているか判別
			if(moveX < 0) {
				isRightMove = true;
			} else {
				isRightMove = false;
			}
			//スライダーを移動させる
			requestID = requestAnimationFrame(() => {
				x = (sliderX - moveX);
				slider.style.transform = 'translateX('+ x + 'px)';
			});
		}

		//マウスアップ、タッチエンド（移動終了）
		const endFunc = e => {
			e.preventDefault();
			//設定をリセット
			slider.classList.remove('is-drag');
			isDown = false;

			//マウスポインタを変更
			sliderWrap.style.cursor = 'grab';

			//スライダーの終了ポイントを過ぎていたら位置を戻す
			if(!isRightMove && x * -1 >= sliderWidth) {
				x = sliderWidth - (x * -1);
				slider.style.transform = 'translateX('+ x + 'px)';
			} else if(isRightMove && x >= 0) {
				x = -(sliderWidth - x);
				slider.style.transform = 'translateX('+ x + 'px)';
			}

			//アニメーションをリセットし画面内の場合は自動スクロール開始
			cancelAnimationFrame(requestID);
			if(isIntersecting) {
				requestID = requestAnimationFrame(scrollAnime);
			}
		}

		//スワイプ対応
		sliderWrap.addEventListener('touchstart', startFunc, {passive: true});
		sliderWrap.addEventListener('touchmove', moveFunc, {passive: true});
		sliderWrap.addEventListener('touchend', endFunc);

		//マウスドラッグ対応
		sliderWrap.addEventListener('mouseenter', () => {
			//マウスポインタを変更
			sliderWrap.style.cursor = 'grab';
		});
		sliderWrap.addEventListener('mousedown', startFunc);
		sliderWrap.addEventListener('mousemove', moveFunc);
		sliderWrap.addEventListener('mouseup', endFunc);
		sliderWrap.addEventListener('mouseleave', endFunc);


		/*
			要素が画面内に入ったら処理開始
		*/
		const observer = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				if(entry.isIntersecting) {
					//自動スクロール開始
          cancelAnimationFrame(requestID);
					requestID = requestAnimationFrame(scrollAnime);

					//画面内判定フラグ（endFunc用）
					isIntersecting = true;
				} else {
					//自動スクロール解除
					cancelAnimationFrame(requestID);

					//画面内判定フラグ（endFunc用）
					isIntersecting = false;
				}
			});
		});
		//observer監視開始
		observer.observe(sliderWrap);


		/*
			レスポンシブ対応
		*/
		//表示エリアリサイズ監視 ResizeObserver
		const resizeObserver = new ResizeObserver(() => {
			//スライダーが途切れないかチェック（画面外の要素が足りなければ追加する）
			initializeSlider(countWidth, addCount);

			//スライダー再定義
			cancelAnimationFrame(requestID);
			requestID = requestAnimationFrame(scrollAnime);
		});

		//リサイズ監視開始（スライダー本体ではなく、最初のスライダー内要素が可変すると発火）
		resizeObserver.observe(firstChild);
	});
}