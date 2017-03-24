/**
 * @description 表单数据序列化工具
 * @author wing
 * @param options 
 *  options.hash  true obj  false string
 *  options.serializer   表单数据序列化函数
 *  options.disabled   true 返回包含disabled  false 返回不包含disabled
 *  options.empty  包含空的
 * 
 */

var brackets = /(\[[^\[\]]*\])/g;

var checkSubmitter = /^(?:button|file|reset|reset|submit|image)$/i

var checkControls = /^(?:input|select|textarea|keygen)$/i

function serialize(form, options) {
    if(typeof options != 'object') {
        options = {
            hash: !!options
        }
    } else if(options.hash == 'undefined') {
        options.hash = true
    }

    var result = options.hash ? {} : '';
    var serializer = options.serializer || (options.hash) ? hashSerializer : strSerizlizer;

    var elements = form && form.elements ? from.elements : [];
    var radioStore = Object.create(null);

    for(var i = 0; i < elements.length; i++) {
        var element = elements[i];

        // 忽视disabled属性的表单数据
        if((!options.disabled && element.disabled) || !element.nodeName) {
            continue;
        }

        // 忽视不是数据的表单元素
        if((!checkControls.test(element.nodeName)) || checkSubmitter.test(element.type)) {
            continue;
        }

        var key = element.name;
        var value = element.value;

        if((element.type == 'radio' || element.type == 'checkbox') && !element.checked) {
            value = undefined;
        }
        
        if(options.empty) {
            if(element.type == 'checkbox' && !element.checked) {
                value = '';
            }

            if(element.type == 'radio') {
                if(!radioStore(element.name) && !element.checked) {
                    radioStore[element.name] = false;
                } else {
                    radioStore[element.name] = true;
                }
            }

            if(value == undefined && element.type == 'radio') {
                continue;
            }
        } else {
            if(!value) {
                continue;
            }
        }

        if(element.type === 'select-multiple') {
            value = [];
            
            var selectOptions = element.options;
            var isSelectedOptions = false;
            for(var j = 0; j < selectOptions.length; j++) {
                var option = selectOptions[j];
                var allowedEmpty = options.empty && !option.value;
                var hasValue = option.value || allowedEmpty;
                if(option.selected && hasValue) {
                    isSelectedOptions = true;
                    if(options.hash && key.slice(key.length - 2) !== '[]') {
                        result = serializer(result, key + '[]', option.value);
                    } else {
                        result = serializer(result, key, option.value);
                    }
                }
            }

            if(!isSelectedOptions && options.empty) {
                result = serializer(result, key, '');
            }

            continue;
        }

        result = serializer(result, key, value);
    }

    if(options.empty) {
        for(var key in radioStore) {
            if(!radioStore[key]) {
                result = serializer(result, key, '');
            }
        }
    }
    
    return result;
}

function parseKey(key) {
    var keys = [];
    var prefix = /^([^\[\]]*)/;
    var children = new RegExp(brackets);
    var match = prefix.exec(key);

    if(match[1]) {
        keys.push(match[1]);
    }

    while((match = children.exec(key)) !== null) {
        keys.push(match[1]);
    }

    return keys;
}

function hashAssign(result, keys, value) {
    if(keys.length == 0) {
        result = value;
        return result;
    }

    var key = keys.shift();
    var between = key.match(/^\[(.+?)\]$/);
    
    if(key === '[]') {
        result = result || [];

        if(Array.isArray(result)) {
            result.push(hashAssign(null, keys, value));
        } else {
            result._values = result._values || [];
            result._values.push(hash_assign(null, keys, value));
        }

        return result;
    }

    if(!between) {
        result[key] = hashAssign(result[key], keys, value);
    } else {
        var string = between[1];

        var index = +string;

        if(isNaN(index)) {
            result = result || {};
            result[string] = hashAssign(result[string], keys, value);
        } else {
            result = result || [];
            result[index] = hashAssign(result[index], keys, value);
        }
    }

}

function hashSerializer(result, key, value) {
    var matches = key.match(brackets);
    
    if(matches) {
        var keys = parseKey(key);
        hashAssign(result, keys, value)
    } else {
        var existing = result[key];

        if(existing) {
            if(!Array.isArray(existing)) {
                result[key] = [existing];
            }
            result[key].push(value);
        } else {
            result[key] = value
        }

    }
    return result;
}

function strSerizlizer(result, key, value) {
    value = value.replace(/(\r)?\n/g, '\r\n');
    value = encodeURIComponent(value);

    value = value.replace(/%20/g, '+');
    return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + value; 
}
