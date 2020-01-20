class color
{
    static from_css(value)
    {
        return new color(value);
    }

    constructor(value)
    {
        this._value = value
    }

    get css()
    {
        return this._value;
    }
}

class coordinate
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    copy()
    {
        return new coordinate(this.x, this.y);
    }

    min(other)
    {
        this.x = Math.min(this.x, other.x);
        this.y = Math.min(this.y, other.y);
    }

    max(other)
    {
        this.x = Math.max(this.x, other.x);
        this.y = Math.max(this.y, other.y);
    }
}

class stroke
{
    constructor(start, color, line_width)
    {
        this.color = color;
        this.line_width = line_width;
        this.max = start.copy();
        this.min = start.copy();
        this.data = [start];
    }

    draw(point)
    {
        this.max.max(point);
        this.min.min(point);
        this.data.push(point);
    }
}

class whiteboard
{
    constructor()
    {
        this.strokes = [];
    }

    create_stroke(where, color, line_width)
    {
        let s = new stroke(where, color, line_width);
        this.strokes.push(s);
        return s;
    }

    stroke_window(window_min, window_max)
    {
        return this.data.filter(function(stroke) {
            return stroke.max.x > window_min.x && stroke.min.x < window_max.x &&
                stroke.max.y > window_min.y && stroke.min.y < window_max.y;
        });
    }

    clear_strokes()
    {
        this.strokes = []
    }
}