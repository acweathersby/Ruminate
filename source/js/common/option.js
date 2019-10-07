// ((graze pull: use js_comments : graze/docs/functions/common/options.js : options, common ))
// Parses options from an object and updates the target according to parameters in option_params
// options is an object
// target is an object
// target_name is a string used for warning messages. 
//
// options_params is a Map that contains [key, value] pairs of the type [string_name, object_pro]:
//
//      The [string_name] is the name of the option. It is matched to the option key names and should be a lower case phrase or word.
//
//      The [object]'s [keys] and associated [values] are 
//
//          value : [Function | String | Symbol ] -
// 
//                  This selects the type of action that is performed when a matching option
//                  is encountered. values with typeof Function will be called with thie target as the this object
//                  and the [option_value] of the option matching [option_key] as its only argument. 
//                                                          
//                  Values of type String or Symbol will be will be used to lookup the associated property in target
//                  which is then assigned the [option_value] of the option property [option_key].
//
//          parse *optional* : Array of [Function | Any] - 
//
//                  Used to convert and or validate the [option_value] before it is applied as an argument or a property value.
//                  If the parse function returns value of [undefined | NaN | null] then the next parse object in the array is
//                  used to process the value. 
//
//                  The last option may be of any type and will be assigned to the value if the preceding parse
//                  entries failed to yield an acceptable value.
//      
//                  If after using all parse entries to render a value the value is still [undefined | null] the
//                  option will not be considered at all.
//    

function NumberIsNaN(value) {
    return typeof value === "number" && isNaN(value);
}

export default function OptionHandler(options = null, target = null, target_name = "", option_params = null) {
    if (!(option_params instanceof Map))
        throw new Error("Option paramaters for [" + target_name + "] need to be placed within a Map")

    // Parser for handling options
    if (options && typeof options == "object" && !Array.isArray(options))
        for (let name in options) {

            name = name.toLowerCase();

            const option_param = option_params.get(name);

            if (option_param) {
                let parse = option_param.parse;

                if (!option_param.parse) parse = [e => e];

                if (!Array.isArray(parse))
                    parse = [parse]

                const original_value = options[name];
                let value = null,
                    index = 0;

                while ((value === null || value === undefined || NumberIsNaN(value))
                    && index < parse.length) {

                    if (typeof parse[index] == "function")
                        value = parse[index++](original_value);
                    else if (parse[index] === original_value) {
                        value = parse[index++];
                        break;
                    }else{
                        value = parse[index++];
                    }
                }

                if (value === undefined || NumberIsNaN(value)) {
                    console.warn(`${target_name} option [${name}] does not accept value [${value}] of type ${typeof value}.`);
                    break;
                }

                switch (typeof option_param.value) {
                    case "function":
                        option_param.value.call(target, value)
                        break;
                    case "symbol":
                    case "string":
                        target[option_param.value] = value
                        break;
                }
            } else {
                const closest = []; //fuzzy.closest([...acceptable_options.keys()], 3, 4);
                console.warn(`${target_name} does not have option [${name}]. ${closes.length > 0 ? `Did you mean ${closest.join(" , ")}?` : ""}`);
            }
        }
}
