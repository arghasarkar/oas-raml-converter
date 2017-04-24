const _ = require('lodash');
const Converter = require('../model/converter');
const ramlHelper = require('../helpers/raml10');

class Raml10AnnotationConverter extends Converter {
	
	_export(model) {
		const ramlDef = {};
		
		for (const id in model.annotations) {
			if (!model.annotations.hasOwnProperty(id)) continue;
			
			const value = model.annotations[id];
			this.exportAnnotation(ramlDef, value);
		}
		
		return ramlDef;
	}
	
	exportAnnotation(ramlDef, value) {
		const name = '(' + value.name + ')';
		ramlDef[name] = value.definition;
		if (value.hasOwnProperty('annotations') && !_.isEmpty(value.annotations)) {
			for (const index in value.annotations) {
				if (!value.annotations.hasOwnProperty(index)) continue;
				
				this.exportAnnotation(ramlDef[name], value.annotations[index]);
			}
		}
	}
	
	_import(ramlDef) {
		const annotations = [];
		
		for (const id in ramlDef.annotations) {
			if (!ramlDef.annotations.hasOwnProperty(id) || id === 'oas-info') continue;
			
			annotations.push(this.importAnnotation(id, ramlDef.annotations[id].structuredValue));
		}
		
		for (const id in ramlDef.scalarsAnnotations) {
			if (!ramlDef.scalarsAnnotations.hasOwnProperty(id)) continue;
			
			const value = ramlDef.scalarsAnnotations[id];
			if (id === 'baseUri') {
				const annotations = this.model.baseUri.annotations ? this.model.baseUri.annotations : [];
				for (const index in value) {
					if (!value.hasOwnProperty(index)) continue;
					
					const val = value[index];
					annotations.push(this.importAnnotation(val.name, value[index].structuredValue));
					this.model.baseUri.annotations = annotations;
				}
			}
		}
		
		return annotations;
	}
	
	importAnnotation(name, value) {
		const annotationPrefix = ramlHelper.getAnnotationPrefix;
		const annotation = { name: name };
		annotation.definition = value;
		
		if (typeof value === 'object') {
			const annotations = [];
			for (const index in value) {
				if (!value.hasOwnProperty(index)) continue;

				const val = value[index];
				if (index.startsWith(annotationPrefix)) {
					annotations.push(this.importAnnotation(index.substring(1, index.length - 1), val));
					delete value[index];
				}
			}
			if (!_.isEmpty(annotations)) annotation.annotations = annotations;
		}
		
		return annotation;
	}
}

module.exports = Raml10AnnotationConverter;