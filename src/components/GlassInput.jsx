import React from 'react';

const GlassInput = ({ value, onChange, placeholder, type = "text", step, min, max, style = {}, ...props }) => {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            className="glass-control"
            style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '11px',
                color: '#fff',
                outline: 'none',
                ...style
            }}
            {...props}
        />
    );
};

export default GlassInput;
