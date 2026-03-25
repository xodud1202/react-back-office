import React, { useState } from 'react';

const OrderList = () => {
    const [text, setText] = useState('');

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">주문 관리 페이지</h1>
            <p>이 페이지는 주문 목록을 관리하는 곳입니다.</p>
            <div className="mt-4">
                <p className="text-lg">상태 유지 테스트 입력:</p>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mt-2 p-2 border border-gray-300 rounded w-full"
                    placeholder="여기에 텍스트를 입력하세요..."
                />
                <p className="mt-2">입력된 텍스트: {text}</p>
            </div>
        </div>
    );
};

export default OrderList;