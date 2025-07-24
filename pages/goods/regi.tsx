import React, { useState } from 'react';

const GoodsRegistration = () => {
  const [itemName, setItemName] = useState('');

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">상품 등록 페이지</h1>
      <p>이 페이지에서 새로운 상품을 등록할 수 있습니다.</p>
      <div className="mt-4">
        <label htmlFor="itemName" className="block text-lg">상품명:</label>
        <input 
          id="itemName"
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="mt-2 p-2 border border-gray-300 rounded w-full"
          placeholder="상품명을 입력하세요..."
        />
        <p className="mt-2">현재 입력된 상품명: {itemName}</p>
        <button 
          onClick={() => alert(`'${itemName}' 상품이 등록되었습니다.`)}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          상품 등록하기
        </button>
      </div>
    </div>
  );
};

export default GoodsRegistration;