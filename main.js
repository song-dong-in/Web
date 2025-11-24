// HTML 문서가 모두 로드된 후(DOM) fetchProducts 함수를 실행합니다.
document.addEventListener('DOMContentLoaded', fetchProducts);

function fetchProducts() {
  // fakestoreapi.com에서 상품 8개 가져오기
  fetch('https://fakestoreapi.com/products') // <-- 이 부분만 변경
    .then(response => {
      // 응답(response)이 성공적인지 확인
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      // 응답 본문을 JSON으로 변환
      return response.json();
    })
    .then(products => {
      // 상품을 담을 컨테이너 요소를 찾음
      const container = document.getElementById('product-container');

      // 받아온 상품 배열(products)을 순회하며 HTML 요소 생성
      products.forEach(product => {
        // 각 상품을 감쌀 <div> (카드) 생성
        const productCard = document.createElement('div');
        productCard.className = 'product-card'; // CSS 스타일링을 위한 클래스

        // productCard 내부에 들어갈 HTML 구성
        productCard.innerHTML = `
          <img src="${product.image}" alt="${product.title}" class="product-image">
          <h3 class="product-title">${product.title}</h3>
          <p class="product-price">$${product.price}</p>
        `;

        // 완성된 상품 카드를 컨테이너에 추가
        container.appendChild(productCard);
      });
    })
    .catch(error => {
      // API 호출 중 오류 발생 시 콘솔에 로그 출력
      console.error('상품 정보를 불러오는 중 오류가 발생했습니다:', error);
    });
}