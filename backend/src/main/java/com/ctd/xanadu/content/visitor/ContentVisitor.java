package com.ctd.xanadu.content.visitor;
import com.ctd.xanadu.content.*;
public interface ContentVisitor<T> {
	T visitStringContent(StringContent c);
	T visitTranscludedContent(TranscludedContent c);
	T visitIntegerContent(IntegerContent c);
	T visitImageContent(ImageContent c);
}
