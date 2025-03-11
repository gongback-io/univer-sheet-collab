import './activityIndicator.css'
export default function ActivityIndicator() {
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
                zIndex: 1000,
            }}
        >
            <div className="spinner" />
        </div>
    );
}
