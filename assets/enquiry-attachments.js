(function (root) {
  'use strict';
  var MAX_BYTES = 7000000;
  var fields = ['floor_plan', 'flooring_photo_1', 'flooring_photo_2'];
  var types = {pdf:'application/pdf', jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp'};
  function size(bytes) { return bytes < 1000000 ? Math.max(0.1, bytes / 1000).toFixed(1) + ' KB' : (Math.ceil(bytes / 10000) / 100).toFixed(2) + ' MB'; }
  function error(message, field) { var e = new Error(message); e.field = field; return e; }
  async function validateFile(file, field) {
    if (!file || !file.size) throw error('Choose a non-empty file, or remove it to continue without an attachment.', field);
    var ext = (file.name.match(/\.([a-z0-9]+)$/i) || [])[1]; ext = (ext || '').toLowerCase();
    if (!types[ext] || (field !== 'floor_plan' && ext === 'pdf')) throw error(field === 'floor_plan' ? 'Choose a PDF, JPG, PNG or WebP floor plan.' : 'Choose a JPG, PNG or WebP photo.', field);
    if (file.name.length > 512 || file.size > MAX_BYTES) throw error('Each file must be 7 MB or smaller; all attachments together must also fit within 7 MB.', field);
    var mime = (file.type || '').toLowerCase().replace('image/jpg', 'image/jpeg');
    if (mime && mime !== types[ext]) throw error('The file type does not match its filename. Export a new copy in a supported format.', field);
    var bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    var matches = ext === 'pdf' ? bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45
      : ext === 'jpg' || ext === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : ext === 'png' ? [137,80,78,71,13,10,26,10].every(function (v,i) { return bytes[i] === v; })
      : [82,73,70,70].every(function(v,i) { return bytes[i] === v; }) && [87,69,66,80].every(function(v,i) { return bytes[i+8] === v; });
    if (!matches) throw error('This file does not look like its selected format. Export a new PDF or image and try again.', field);
  }
  async function validateEntries(entries) {
    var total = 0, count = 0, seen = new Set();
    for (var pair of entries) {
      var name = pair[0], file = pair[1];
      if (typeof file === 'string') continue;
      if (!file.name && !file.size) continue;
      if (fields.indexOf(name) < 0 || seen.has(name)) throw error('Choose one file per upload field, with no more than one plan and two photos.', name);
      seen.add(name); total += file.size; count++;
      if (total > MAX_BYTES) throw error('Attachments total ' + size(total) + '. Please reduce them to 7 MB combined or remove a file.', name);
      await validateFile(file, name);
    }
    return {count:count, bytes:total};
  }
  async function prepare(form, data) {
    await validateEntries(Array.from(data.entries()));
    fields.forEach(function (name) { var file = data.get(name); if (file && typeof file !== 'string' && !file.name && !file.size) data.delete(name); });
    var textBytes = 0;
    data.forEach(function (value, name) { if (typeof value === 'string') textBytes += new Blob([name, value]).size; });
    if (textBytes > 128000) throw error('Your enquiry text is too long. Shorten the message or contact the team directly.');
    return data;
  }
  function initialise(form) {
    var section = form.querySelector('[data-enquiry-uploads]');
    if (!section || section.dataset.uploadsReady) return;
    section.dataset.uploadsReady = 'true';
    var version = 0;
    function changed() {
      var current = ++version, entries = [];
      fields.forEach(function(name) {
        var input = form.elements.namedItem(name), file = input.files[0], status = section.querySelector('[data-upload-status="'+name+'"]');
        input.setCustomValidity('');
        status.textContent = file ? file.name + ' · ' + size(file.size) : 'No file selected';
        section.querySelectorAll('[data-upload-for="'+name+'"]').forEach(function(button) { button.hidden = !file; });
        if (file) entries.push([name, file]);
      });
      var total = entries.reduce(function(n,p) { return n+p[1].size; },0), note = section.querySelector('[data-upload-total]');
      note.textContent = entries.length ? size(total) + ' of 7 MB selected. Checking files…' : 'No attachments selected. You can send the form without files.';
      validateEntries(entries).then(function() { if(current===version)note.textContent=entries.length?size(total)+' of 7 MB selected.': 'No attachments selected. You can send the form without files.'; }).catch(function(e) {
        if(current!==version)return;note.textContent=e.message;var input=form.elements.namedItem(e.field);if(input)input.setCustomValidity(e.message);
      });
    }
    fields.forEach(function(name) { form.elements.namedItem(name).addEventListener('change', changed); });
    section.querySelectorAll('[data-upload-for]').forEach(function(button) { button.addEventListener('click',function() {
      var input=form.elements.namedItem(button.dataset.uploadFor);
      if(button.dataset.uploadAction==='remove'){input.value='';changed();input.focus();}else input.click();
    }); });
    changed();
  }
  var api = {MAX_BYTES:MAX_BYTES, fields:fields, validateFile:validateFile, validateEntries:validateEntries, prepare:prepare, initialise:initialise};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OZ_ENQUIRY_ATTACHMENTS = api;
})(typeof window === 'undefined' ? globalThis : window);
