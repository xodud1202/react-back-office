'use client';

import { type RefObject, useEffect, useRef } from 'react';
import {
  Chart,
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  BarController,
  BarElement,
  ScatterController,
  PieController,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  BarController,
  BarElement,
  ScatterController,
  PieController,
  Tooltip,
  Legend,
);

/**
 * 대시보드 메인 차트 화면을 렌더링합니다.
 * @returns 차트 샘플이 포함된 메인 화면입니다.
 */
export default function Main() {
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const areaChartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const scatterChartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const destroyCallbacks: Array<() => void> = [];

    /**
     * 캔버스와 차트 구성을 받아 차트 인스턴스를 생성합니다.
     * @param ref 차트를 렌더링할 캔버스 ref입니다.
     * @param config Chart.js 구성입니다.
     */
    const createChart = (ref: RefObject<HTMLCanvasElement | null>, config: ConstructorParameters<typeof Chart>[1]) => {
      if (!ref.current) {
        return;
      }
      const chart = new Chart(ref.current, config);
      destroyCallbacks.push(() => chart.destroy());
    };

    // 다양한 차트 유형을 동일 패턴으로 초기화합니다.
    createChart(lineChartRef, {
      type: 'line',
      data: {
        labels: ['월', '화', '수', '목', '금', '토', '일'],
        datasets: [
          {
            label: '매출',
            data: [12, 19, 15, 24, 21, 30, 26],
            borderColor: '#0090e7',
            backgroundColor: 'rgba(0, 144, 231, 0.18)',
            tension: 0.35,
            fill: false,
          },
        ],
      },
    });
    createChart(barChartRef, {
      type: 'bar',
      data: {
        labels: ['1주', '2주', '3주', '4주'],
        datasets: [
          {
            label: '주문수',
            data: [120, 98, 140, 110],
            backgroundColor: ['#00d25b', '#ffab00', '#fc424a', '#8f5fe8'],
          },
        ],
      },
    });
    createChart(areaChartRef, {
      type: 'line',
      data: {
        labels: ['1월', '2월', '3월', '4월', '5월'],
        datasets: [
          {
            label: '방문자',
            data: [220, 260, 240, 310, 360],
            borderColor: '#00d25b',
            backgroundColor: 'rgba(0, 210, 91, 0.18)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
    });
    createChart(doughnutChartRef, {
      type: 'doughnut',
      data: {
        labels: ['모바일', 'PC', '태블릿'],
        datasets: [
          {
            data: [56, 31, 13],
            backgroundColor: ['#0090e7', '#00d25b', '#ffab00'],
          },
        ],
      },
    });
    createChart(pieChartRef, {
      type: 'pie',
      data: {
        labels: ['정상', '보류', '완료'],
        datasets: [
          {
            data: [44, 12, 28],
            backgroundColor: ['#00d25b', '#ffab00', '#fc424a'],
          },
        ],
      },
    });
    createChart(scatterChartRef, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '상품 분포',
            data: [
              { x: 12, y: 18 },
              { x: 16, y: 26 },
              { x: 22, y: 17 },
              { x: 28, y: 29 },
              { x: 34, y: 23 },
            ],
            backgroundColor: '#8f5fe8',
          },
        ],
      },
    });

    // 화면 이탈 시 생성된 차트를 모두 정리합니다.
    return () => {
      destroyCallbacks.forEach((destroyChart) => destroyChart());
    };
  }, []);

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> Chart-js </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">Charts</a></li>
            <li className="breadcrumb-item active" aria-current="page">Chart-js</li>
          </ol>
        </nav>
      </div>
      <div className="row">
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Line chart</h4>
              <canvas ref={lineChartRef} style={{ height: '250px' }}></canvas>
            </div>
          </div>
        </div>
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Bar chart</h4>
              <canvas ref={barChartRef} style={{ height: '230px' }}></canvas>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Area chart</h4>
              <canvas ref={areaChartRef} style={{ height: '250px' }}></canvas>
            </div>
          </div>
        </div>
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Doughnut chart</h4>
              <div className="doughnutjs-wrapper d-flex justify-content-center">
                <canvas ref={doughnutChartRef} style={{ height: '250px' }}></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Pie chart</h4>
              <div className="doughnutjs-wrapper d-flex justify-content-center">
                <canvas ref={pieChartRef} style={{ height: '250px' }}></canvas>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Scatter chart</h4>
              <canvas ref={scatterChartRef} style={{ height: '250px' }}></canvas>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
