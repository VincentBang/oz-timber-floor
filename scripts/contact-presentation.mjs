// Owner-approved contact-page presentation only. No form/config/backend changes.
export function contactDetailsPresentation(html){
 if(!/rel="canonical" href="https:\/\/oztimberfloor\.com\.au\/contact\/"/.test(html))return html;
 const prefix=/<p class="contact-details"><strong>Phone:<\/strong> <a href="([^"]+)">([^<]+)<\/a><br><strong>Second phone:<\/strong> <a href="([^"]+)">([^<]+)<\/a><br><strong>Email:<\/strong> <a href="([^"]+)">([^<]+)<\/a><br>/;
 const m=html.match(prefix);if(!m)return html;
 if(!html.includes('<div class="contact-actions" data-contact-actions=""></div>'))throw Error('Unexpected contact action markup; preserve source for review');
 // Static numbered buttons also work without JS; the existing enhancer replaces
 // their contents from canonical configuration rather than appending duplicates.
 const actions='<div class="contact-actions" data-contact-actions=""><a class="button" href="'+m[1]+'">Call '+m[2]+'</a><a class="button-secondary" href="'+m[3]+'">Call '+m[4]+'</a><a class="button-secondary" href="'+m[5]+'?subject=Oz%20Timber%20Floor%20enquiry">Email '+m[6]+'</a></div>';
 return html.replace('<div class="contact-actions" data-contact-actions=""></div>',actions).replace(prefix,'<p class="contact-details">');
}
