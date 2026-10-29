// Suggestions are local UI only; selecting one never sends a provider request.
export function suggestionsFor(path){
 if(/^\/products\/[a-z0-9-]+\/$/.test(path))return ['Ask about this product','Compare flooring options','Plan an installation'];
 if(path==='/floor-levelling/')return ['How do I plan floor levelling?','What affects installation cost?','Plan an installation'];
 return ['Help me choose flooring','Compare flooring options','Plan an installation'];
}
