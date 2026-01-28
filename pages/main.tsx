// pages/main.tsx
import { useEffect } from 'react';

export default function Main() {
  useEffect(() => {
    // SPA 전환 시 차트 스크립트를 재실행합니다.
    const loadScript = (src: string, id: string, forceReload = false) => {
      return new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(id) as HTMLScriptElement | null;
        if (existing && forceReload) {
          existing.remove();
        }
        if (!document.getElementById(id)) {
          const script = document.createElement('script');
          script.id = id;
          script.src = src;
          script.async = false;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
          document.body.appendChild(script);
        } else {
          resolve();
        }
      });
    };

    const run = async () => {
      try {
        await loadScript('/assets/vendors/chart.js/chart.umd.js', 'chartjs-vendor');
        await loadScript('/assets/js/chart.js', 'chartjs-page', true);
      } catch (error) {
        console.error(error);
      }
    };

    run();
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
              <canvas id="lineChart" style={{ height: '250px' }}></canvas>
            </div>
          </div>
        </div>
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Bar chart</h4>
              <canvas id="barChart" style={{ height: '230px' }}></canvas>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Area chart</h4>
              <canvas id="areaChart" style={{ height: '250px' }}></canvas>
            </div>
          </div>
        </div>
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Doughnut chart</h4>
              <div className="doughnutjs-wrapper d-flex justify-content-center">
                <canvas id="doughnutChart" style={{ height: '250px' }}></canvas>
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
                <canvas id="pieChart" style={{ height: '250px' }}></canvas>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Scatter chart</h4>
              <canvas id="scatterChart" style={{ height: '250px' }}></canvas>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
