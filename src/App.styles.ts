import React from 'react';

export const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundImage: `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5CAAAAG0lEQVQYV2NkYGD4z8DAwMgAAp8LgPInhfxBAA87AwB1G3w+8A8C8wAAAABJRU5ErkJggg=='), radial-gradient(ellipse at center, #007038 0%, #004020 100%)`,
    overflow: 'hidden',
    position: 'relative',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  },
  turnIndicator: {
      position: 'absolute',
      top: '10px',
      left: '10px',
      padding: '10px 20px',
      backgroundColor: 'rgba(0,0,0,0.5)',
      color: 'white',
      borderRadius: '10px',
      fontSize: '16px',
  }
};